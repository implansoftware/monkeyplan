import { Link } from "wouter";
import { useEffect } from "react";
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

const faqItems: FaqItem[] = [
  {
    category: "Generale",
    question: "Cos'è MonkeyPlan?",
    answer: "MonkeyPlan è un software gestionale completo pensato per centri di assistenza tecnica, negozi di telefonia, rivendita usato e reti multi-negozio. Gestisce riparazioni, magazzino, fatturazione, POS fiscale, ticketing, CRM e molto altro in un'unica piattaforma.",
  },
  {
    category: "Generale",
    question: "MonkeyPlan è gratuito?",
    answer: "Sì, le prime 100 licenze sono completamente gratuite. Potrai utilizzare tutte le funzionalità della piattaforma senza alcun costo.",
  },
  {
    category: "Generale",
    question: "Devo installare qualcosa?",
    answer: "No, MonkeyPlan è una piattaforma web accessibile da qualsiasi browser. Non serve installare software, basta una connessione internet.",
  },
  {
    category: "Funzionalità",
    question: "Quali ruoli supporta la piattaforma?",
    answer: "MonkeyPlan supporta 4 ruoli principali: Amministratore (gestione completa), Rivenditore (vendita e distribuzione), Centro Riparazione (gestione riparazioni) e Cliente (tracking e richieste). Ogni ruolo ha il proprio staff dedicato.",
  },
  {
    category: "Funzionalità",
    question: "Posso gestire più negozi?",
    answer: "Assolutamente sì. MonkeyPlan è progettato per reti multi-negozio con supporto per magazzini multipli, trasferimenti merce, ordini B2B tra sedi e gestione centralizzata.",
  },
  {
    category: "Funzionalità",
    question: "Il POS è conforme alla normativa fiscale italiana?",
    answer: "Sì, il nostro POS supporta multi-aliquota IVA, corrispettivi telematici, numerazione progressiva giornaliera, codice lotteria e integrazione con Registratore Telematico cloud tramite Fiskaly SIGN IT.",
  },
  {
    category: "Funzionalità",
    question: "Come funzionano le garanzie e le assicurazioni?",
    answer: "MonkeyPlan include un sistema completo per la gestione di garanzie e assicurazioni: catalogo garanzie multi-tenant, offerta durante l'intake delle riparazioni, storico completo per cliente e fatturazione automatica.",
  },
  {
    category: "Tecnico",
    question: "I miei dati sono al sicuro?",
    answer: "Sì, utilizziamo database PostgreSQL con backup continui, connessioni crittografate e autenticazione sicura basata su sessioni. I dati sono protetti secondo le normative europee.",
  },
  {
    category: "Tecnico",
    question: "Posso integrare MonkeyPlan con i miei fornitori?",
    answer: "Sì, MonkeyPlan supporta integrazioni con fornitori come SIFAR, Foneday e MobileSentrix per l'importazione automatica di cataloghi, gestione ordini e tracking spedizioni.",
  },
  {
    category: "Tecnico",
    question: "È disponibile un'app mobile?",
    answer: "Stiamo sviluppando un'app mobile con supporto per notifiche push tramite Expo. La piattaforma web è già completamente responsive e utilizzabile da smartphone e tablet.",
  },
  {
    category: "Supporto",
    question: "Come posso ricevere supporto?",
    answer: "Una volta registrato, puoi aprire ticket di supporto direttamente dalla dashboard. Il nostro team risponde entro 24 ore lavorative. Per informazioni generali puoi contattarci via email.",
  },
  {
    category: "Supporto",
    question: "Posso suggerire nuove funzionalità?",
    answer: "Certamente! Il feedback degli utenti è fondamentale. Puoi inviarci suggerimenti tramite il sistema di ticketing o via email.",
  },
];

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
  usePageTitle("FAQ - Domande Frequenti");
  useEffect(() => { window.scrollTo(0, 0); }, []);
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
            Domande{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Frequenti
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-faq-subtitle">
            Trova le risposte alle domande più comuni su MonkeyPlan. Se non trovi quello che cerchi,
            non esitare a contattarci.
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
          <h2 className="text-2xl font-bold mb-4">Non hai trovato la risposta?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Contattaci direttamente, saremo felici di aiutarti.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" data-testid="link-faq-contact">
              <Button data-testid="button-faq-contact">
                Contattaci
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth" data-testid="link-faq-register">
              <Button variant="outline" data-testid="button-faq-register">
                Registrati Gratis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
