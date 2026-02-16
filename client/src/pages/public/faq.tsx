import { Link } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HelpCircle,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

function FaqAccordion({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      className="overflow-visible"
      data-testid={`faq-item-${index}`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen(!open)}
        data-testid={`button-faq-toggle-${index}`}
      >
        <span className="font-medium text-sm">{item.question}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </Card>
  );
}

export default function FaqPage() {
  const { t } = useTranslation();
  usePageTitle("FAQ - Domande Frequenti");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const faqItems: FaqItem[] = [
    { category: t("public.faq.categories.general"), question: t("public.faq.items.q1"), answer: t("public.faq.items.a1") },
    { category: t("public.faq.categories.general"), question: t("public.faq.items.q2"), answer: t("public.faq.items.a2") },
    { category: t("public.faq.categories.general"), question: t("public.faq.items.q3"), answer: t("public.faq.items.a3") },
    { category: t("public.faq.categories.features"), question: t("public.faq.items.q4"), answer: t("public.faq.items.a4") },
    { category: t("public.faq.categories.features"), question: t("public.faq.items.q5"), answer: t("public.faq.items.a5") },
    { category: t("public.faq.categories.features"), question: t("public.faq.items.q6"), answer: t("public.faq.items.a6") },
    { category: t("public.faq.categories.features"), question: t("public.faq.items.q7"), answer: t("public.faq.items.a7") },
    { category: t("public.faq.categories.technical"), question: t("public.faq.items.q8"), answer: t("public.faq.items.a8") },
    { category: t("public.faq.categories.technical"), question: t("public.faq.items.q9"), answer: t("public.faq.items.a9") },
    { category: t("public.faq.categories.technical"), question: t("public.faq.items.q10"), answer: t("public.faq.items.a10") },
    { category: t("public.faq.categories.support"), question: t("public.faq.items.q11"), answer: t("public.faq.items.a11") },
    { category: t("public.faq.categories.support"), question: t("public.faq.items.q12"), answer: t("public.faq.items.a12") },
  ];

  const categories = Array.from(new Set(faqItems.map((f) => f.category)));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-16 px-4" data-testid="section-faq-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-faq-title">
            {t("public.faq.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {t("public.faq.titleHighlight")}
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-faq-subtitle">
            {t("public.faq.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 px-4" data-testid="section-faq-list">
        <div className="max-w-3xl mx-auto space-y-10">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-lg font-bold mb-4 text-emerald-700 dark:text-emerald-400" data-testid={`text-faq-category-${cat.toLowerCase()}`}>
                {cat}
              </h2>
              <div className="space-y-3">
                {faqItems
                  .filter((f) => f.category === cat)
                  .map((item, i) => (
                    <FaqAccordion key={i} item={item} index={faqItems.indexOf(item)} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900/50 text-center" data-testid="section-faq-cta">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">{t("public.faq.ctaTitle")}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t("public.faq.ctaSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" data-testid="link-faq-contact">
              <Button data-testid="button-faq-contact">
                {t("public.faq.ctaContact")}
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth" data-testid="link-faq-register">
              <Button variant="outline" data-testid="button-faq-register">
                {t("public.faq.ctaRegister")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
