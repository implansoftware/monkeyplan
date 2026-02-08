import { useEffect } from "react";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Titolare del Trattamento",
    content: "Il Titolare del trattamento dei dati è MonkeyPlan, con sede in Italia. Per qualsiasi richiesta relativa al trattamento dei dati personali, è possibile contattarci all'indirizzo email: privacy@monkeyplan.it.",
  },
  {
    title: "2. Dati Raccolti",
    content: "Raccogliamo le seguenti categorie di dati: (a) Dati di registrazione: nome, cognome, email, nome utente, ruolo; (b) Dati aziendali: ragione sociale, partita IVA, codice fiscale, indirizzo; (c) Dati di utilizzo: log di accesso, azioni sulla piattaforma, preferenze; (d) Dati tecnici: indirizzo IP, tipo di browser, sistema operativo; (e) Dati dei dispositivi gestiti: IMEI, seriale, modello (inseriti dall'utente per la gestione riparazioni).",
  },
  {
    title: "3. Finalità del Trattamento",
    content: "I dati personali sono trattati per le seguenti finalità: (a) fornitura e gestione del Servizio; (b) autenticazione e sicurezza dell'account; (c) comunicazioni relative al Servizio; (d) adempimento di obblighi legali e fiscali; (e) miglioramento della Piattaforma e analisi aggregate; (f) supporto tecnico e gestione ticket.",
  },
  {
    title: "4. Base Giuridica",
    content: "Il trattamento dei dati si fonda sulle seguenti basi giuridiche ai sensi del GDPR: (a) esecuzione del contratto (art. 6.1.b); (b) adempimento di obblighi legali (art. 6.1.c); (c) legittimo interesse del Titolare (art. 6.1.f); (d) consenso dell'interessato, ove richiesto (art. 6.1.a).",
  },
  {
    title: "5. Conservazione dei Dati",
    content: "I dati personali sono conservati per il tempo necessario al perseguimento delle finalità per cui sono stati raccolti. I dati dell'account sono conservati per tutta la durata del rapporto contrattuale e per i successivi 10 anni per adempiere agli obblighi fiscali e legali. I log di accesso sono conservati per 6 mesi.",
  },
  {
    title: "6. Condivisione dei Dati",
    content: "I dati personali non vengono venduti a terzi. Possono essere condivisi con: (a) fornitori di servizi tecnici (hosting, database) necessari al funzionamento della Piattaforma; (b) autorità competenti ove richiesto dalla legge; (c) altri utenti della Piattaforma limitatamente a quanto necessario per il funzionamento del Servizio (es. dati di contatto tra rivenditore e centro riparazione).",
  },
  {
    title: "7. Sicurezza",
    content: "Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali, tra cui: crittografia delle comunicazioni (TLS), hashing delle password, controllo degli accessi basato su ruoli, backup periodici, monitoraggio degli accessi.",
  },
  {
    title: "8. Diritti dell'Interessato",
    content: "Ai sensi del GDPR, l'interessato ha diritto di: (a) accedere ai propri dati personali; (b) rettificare dati inesatti; (c) cancellare i propri dati (\"diritto all'oblio\"); (d) limitare il trattamento; (e) portabilità dei dati; (f) opporsi al trattamento; (g) revocare il consenso. Per esercitare questi diritti, contattare: privacy@monkeyplan.it.",
  },
  {
    title: "9. Cookie e Tecnologie di Tracciamento",
    content: "La Piattaforma utilizza cookie tecnici strettamente necessari al funzionamento del Servizio (es. gestione della sessione di autenticazione). Non utilizziamo cookie di profilazione o di terze parti per finalità pubblicitarie.",
  },
  {
    title: "10. Trasferimento dei Dati",
    content: "I dati sono conservati su server situati nell'Unione Europea. In caso di trasferimento verso paesi terzi, verranno adottate le garanzie previste dal GDPR, incluse le Clausole Contrattuali Standard approvate dalla Commissione Europea.",
  },
  {
    title: "11. Minori",
    content: "Il Servizio non è rivolto a minori di 16 anni. Non raccogliamo consapevolmente dati di minori. Se veniamo a conoscenza di aver raccolto dati di un minore, provvederemo alla loro cancellazione.",
  },
  {
    title: "12. Modifiche alla Privacy Policy",
    content: "Ci riserviamo il diritto di aggiornare la presente Privacy Policy. Le modifiche saranno comunicate tramite la Piattaforma e/o via email. La data dell'ultimo aggiornamento è indicata in cima al documento.",
  },
  {
    title: "13. Reclami",
    content: "L'interessato ha il diritto di proporre reclamo all'autorità di controllo competente (Garante per la Protezione dei Dati Personali) qualora ritenga che il trattamento dei propri dati violi il GDPR.",
  },
];

export default function PrivacyPage() {
  usePageTitle("Privacy Policy");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-8 px-4" data-testid="section-privacy-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Privacy
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-privacy-title">
            Privacy{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ultimo aggiornamento: Febbraio 2026
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-4 leading-relaxed">
            La tua privacy è importante per noi. Questa Privacy Policy descrive come MonkeyPlan
            raccoglie, utilizza, conserva e protegge i tuoi dati personali in conformità al
            Regolamento UE 2016/679 (GDPR).
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
