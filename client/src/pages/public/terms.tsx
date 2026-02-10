import { useEffect } from "react";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Definizioni",
    content: `"Piattaforma" si riferisce a MonkeyPlan, il software gestionale accessibile via web. "Utente" indica qualsiasi persona fisica o giuridica che crea un account sulla Piattaforma. "Servizio" indica le funzionalità offerte dalla Piattaforma, incluse ma non limitate a: gestione riparazioni, magazzino, POS fiscale, ticketing, CRM, ordini B2B e marketplace.`,
  },
  {
    title: "2. Accettazione dei Termini",
    content: "L'accesso e l'utilizzo della Piattaforma sono subordinati all'accettazione dei presenti Termini e Condizioni. Registrandoti e utilizzando MonkeyPlan, accetti integralmente questi termini. Se non accetti, non utilizzare il Servizio.",
  },
  {
    title: "3. Registrazione e Account",
    content: "Per utilizzare la Piattaforma è necessario creare un account fornendo informazioni veritiere e aggiornate. Sei responsabile della sicurezza delle tue credenziali di accesso e di tutte le attività svolte tramite il tuo account. MonkeyPlan si riserva il diritto di sospendere o chiudere account che violino i presenti termini.",
  },
  {
    title: "4. Licenza d'Uso",
    content: "MonkeyPlan concede all'Utente una licenza limitata, non esclusiva, non trasferibile e revocabile per l'utilizzo della Piattaforma conformemente ai presenti Termini. MonkeyPlan si riserva di modificare i piani tariffari con adeguato preavviso.",
  },
  {
    title: "5. Obblighi dell'Utente",
    content: "L'Utente si impegna a: (a) utilizzare la Piattaforma nel rispetto delle leggi vigenti; (b) non tentare di accedere in modo non autorizzato ai sistemi; (c) non utilizzare la Piattaforma per attività illecite, fraudolente o dannose; (d) mantenere aggiornate le proprie informazioni; (e) rispettare gli obblighi fiscali relativi all'utilizzo del POS e delle funzionalità di fatturazione.",
  },
  {
    title: "6. Proprietà Intellettuale",
    content: "Tutti i diritti di proprietà intellettuale relativi alla Piattaforma, inclusi software, design, marchi, loghi e contenuti, appartengono a MonkeyPlan. L'Utente non acquisisce alcun diritto di proprietà sulla Piattaforma. I dati inseriti dall'Utente rimangono di proprietà dell'Utente.",
  },
  {
    title: "7. Trattamento dei Dati",
    content: "Il trattamento dei dati personali è disciplinato dalla nostra Privacy Policy. MonkeyPlan tratta i dati in conformità al Regolamento UE 2016/679 (GDPR). Utilizzando la Piattaforma, l'Utente acconsente al trattamento dei propri dati come descritto nella Privacy Policy.",
  },
  {
    title: "8. Limitazione di Responsabilità",
    content: "MonkeyPlan è fornito \"così com'è\". Non garantiamo che il Servizio sia privo di errori o interruzioni. MonkeyPlan non è responsabile per danni diretti, indiretti, incidentali o consequenziali derivanti dall'uso della Piattaforma, incluse perdite di dati, mancati guadagni o interruzioni di attività.",
  },
  {
    title: "9. Conformità Fiscale",
    content: "Le funzionalità di POS fiscale e fatturazione sono strumenti di supporto. L'Utente è l'unico responsabile della corretta applicazione delle normative fiscali vigenti, incluse le aliquote IVA, l'emissione dei corrispettivi e l'invio telematico. MonkeyPlan non fornisce consulenza fiscale.",
  },
  {
    title: "10. Modifiche ai Termini",
    content: "MonkeyPlan si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche saranno comunicate tramite la Piattaforma o via email. L'uso continuato del Servizio dopo la notifica di modifica costituisce accettazione dei nuovi Termini.",
  },
  {
    title: "11. Risoluzione",
    content: "L'Utente può chiudere il proprio account in qualsiasi momento. MonkeyPlan si riserva il diritto di sospendere o chiudere un account in caso di violazione dei presenti Termini, con preavviso ove possibile.",
  },
  {
    title: "12. Legge Applicabile e Foro Competente",
    content: "I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia derivante dall'uso della Piattaforma è competente il Foro del luogo di sede legale di MonkeyPlan.",
  },
];

export default function TermsPage() {
  usePageTitle("Termini e Condizioni");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-8 px-4" data-testid="section-terms-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <FileText className="w-3.5 h-3.5" />
            Legale
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-terms-title">
            Termini e{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Condizioni
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ultimo aggiornamento: Febbraio 2026
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
