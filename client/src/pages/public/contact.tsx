import { Link } from "wouter";
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

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Scrivici per qualsiasi domanda o richiesta di informazioni.",
    detail: "info@monkeyplan.it",
    action: "mailto:info@monkeyplan.it",
  },
  {
    icon: MessageSquare,
    title: "Supporto Tecnico",
    description: "Hai bisogno di assistenza tecnica sulla piattaforma? Apri un ticket.",
    detail: "Disponibile via ticket dalla dashboard",
    action: "/auth",
  },
  {
    icon: Phone,
    title: "Telefono",
    description: "Per richieste urgenti o commerciali.",
    detail: "Lun-Ven 9:00-18:00",
    action: null,
  },
];

export default function ContactPage() {
  usePageTitle("Contatti");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-16 px-4" data-testid="section-contact-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Mail className="w-3.5 h-3.5" />
            Contatti
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-contact-title">
            Parliamo del tuo{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              progetto
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-contact-subtitle">
            Siamo qui per aiutarti. Che tu abbia una domanda, un suggerimento o voglia saperne di più,
            non esitare a contattarci.
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
              <h2 className="text-2xl font-bold mb-6">Informazioni</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sede</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Italia</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Orari</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Lunedì - Venerdì: 9:00 - 18:00</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sabato - Domenica: Chiuso</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Risposta rapida</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Rispondiamo entro 24 ore lavorative a tutte le richieste.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Hai bisogno di assistenza?</h2>
              <Card className="p-6" data-testid="card-contact-support">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Se sei già un utente registrato, il modo più veloce per ricevere supporto
                  è aprire un ticket direttamente dalla tua dashboard. Il nostro team risponde
                  rapidamente a ogni segnalazione.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Se non sei ancora registrato, puoi creare un account gratuito e iniziare subito
                  a esplorare la piattaforma.
                </p>
                <Link href="/auth" data-testid="link-contact-cta">
                  <Button data-testid="button-contact-cta">
                    Accedi alla piattaforma
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
