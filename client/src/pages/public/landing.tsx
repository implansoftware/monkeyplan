import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Wrench,
  Package,
  ShoppingCart,
  Smartphone,
  Users,
  ArrowRight,
  Shield,
  BarChart3,
  Globe,
  RefreshCw,
  Gift,
  CheckCircle,
  Store,
  Truck,
  CreditCard,
  Layers,
  Network,
  ChevronRight,
  Menu,
  X,
  Building2,
  Tablet,
  Headphones,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import monkeyAstronautHero from "@/assets/images/monkey-astronaut-hero.png";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[999] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800" data-testid="navbar-landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 h-16">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-brand">MonkeyPlan</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-nav-features">Funzionalit&agrave;</a>
            <a href="#multistore" className="text-sm text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-nav-multistore">Multi-Negozio</a>
            <a href="#integrations" className="text-sm text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-nav-integrations">Integrazioni</a>
            <a href="#offer" className="text-sm text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-nav-offer">100 Licenze</a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="outline" size="sm" data-testid="button-login">
                Accedi
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-emerald-600" data-testid="button-register">
                Registrati
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-500 dark:text-slate-400" data-testid="link-mobile-features">Funzionalit&agrave;</a>
          <a href="#multistore" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-500 dark:text-slate-400" data-testid="link-mobile-multistore">Multi-Negozio</a>
          <a href="#integrations" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-500 dark:text-slate-400" data-testid="link-mobile-integrations">Integrazioni</a>
          <a href="#offer" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-500 dark:text-slate-400" data-testid="link-mobile-offer">100 Licenze</a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-400/25 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-emerald-300/30 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute top-24 right-12 hidden lg:block p-3 rounded-2xl bg-orange-400/20 backdrop-blur-sm border border-orange-300/30 animate-bounce" style={{ animationDuration: "3s" }}>
        <Tablet className="h-6 w-6 text-orange-200" />
      </div>
      <div className="absolute bottom-32 left-8 hidden lg:block p-3 rounded-2xl bg-yellow-400/20 backdrop-blur-sm border border-yellow-300/30 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
        <Headphones className="h-6 w-6 text-yellow-200" />
      </div>
      <div className="absolute top-1/2 right-24 hidden lg:block p-3 rounded-2xl bg-cyan-400/20 backdrop-blur-sm border border-cyan-300/30 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
        <Smartphone className="h-6 w-6 text-cyan-200" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <span className="inline-block px-4 py-1.5 text-xs font-medium rounded-full bg-yellow-400/30 backdrop-blur-sm text-yellow-100 border border-yellow-300/30">
              Beta v.24
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white" data-testid="text-hero-title">
              Il gestionale operativo per{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-200">assistenza tecnica</span>,{" "}
              retail telefonia e rivendita usato
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed" data-testid="text-hero-subtitle">
              Un software gestionale completo pensato per chi lavora ogni giorno sul campo:
              centri di assistenza, negozi di telefonia, rivendita di dispositivi usati
              e reti multi-negozio.
            </p>

            <p className="text-sm text-white/60">
              Nasce dall'esperienza reale di chi conosce i problemi quotidiani del settore
              e ha deciso di trasformarli in processi chiari, standardizzati e scalabili.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-4">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-emerald-700 border-white/80 font-semibold shadow-lg shadow-emerald-900/20" data-testid="button-hero-cta">
                  Inizia Ora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#features" data-testid="link-hero-features">
                <Button variant="outline" size="lg" className="text-white border-white/30 bg-white/10 backdrop-blur-sm" data-testid="button-hero-features">
                  Scopri le funzionalit&agrave;
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-white font-medium">Online</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                <Shield className="w-4 h-4 text-yellow-300" />
                <span className="text-sm text-white font-medium">Enterprise Ready</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 hidden lg:flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 rounded-full blur-3xl opacity-20 animate-pulse" />
              <img
                src={monkeyAstronautHero}
                alt="MonkeyPlan mascot"
                className="relative w-80 h-80 object-contain drop-shadow-2xl"
                style={{ animation: "float 4s ease-in-out infinite" }}
                data-testid="img-hero-mascot"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}

const features = [
  {
    icon: Wrench,
    title: "Assistenza Tecnica",
    description:
      "Accettazione, diagnosi, preventivo, approvazione cliente, lavorazione, test, consegna e storico completo di clienti e dispositivi.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: Package,
    title: "Magazzino e Ricambi",
    description:
      "Carichi e scarichi, compatibilit\u00e0, resi, fornitori, DDT, costi e marginalit\u00e0 sempre sotto controllo.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: ShoppingCart,
    title: "Vendita e Cassa",
    description:
      "Documenti, incassi, pagamenti digitali, rate e cross-selling di accessori e servizi. POS fiscale integrato.",
    gradient: "from-orange-400 to-amber-500",
  },
  {
    icon: Smartphone,
    title: "Usato e Permute",
    description:
      "Valutazione dispositivi, ritiro, classificazione, ricondizionamento e rivendita con marginalit\u00e0 reale per singolo device.",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Users,
    title: "CRM",
    description:
      "Clienti, consensi, dispositivi, comunicazioni e storico interazioni centralizzati in un unico punto.",
    gradient: "from-teal-400 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Garanzie e Assicurazioni",
    description:
      "Catalogo garanzie multi-tenant, offerta durante l'accettazione, storico cliente e analytics dedicate.",
    gradient: "from-blue-400 to-cyan-500",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-features-title">
            Un unico sistema, tutti i servizi
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            MonkeyPlan non &egrave; un semplice programma di ticketing. &Egrave; una piattaforma operativa
            integrata che unisce in un solo ambiente tutto ci&ograve; che serve per lavorare bene.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="p-6 space-y-4 rounded-2xl hover-elevate"
              data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const multiStorePoints = [
  {
    icon: Building2,
    text: "Gestisci pi\u00f9 punti vendita da un unico sistema, con ruoli e permessi differenziati.",
  },
  {
    icon: Network,
    text: "Controllo centrale e autonomia operativa locale per ogni sede.",
  },
  {
    icon: RefreshCw,
    text: "Scambi interni di ricambi, dispositivi e accessori tracciati, verificabili e ordinati.",
  },
  {
    icon: BarChart3,
    text: "Ogni movimento \u00e8 registrato, ogni responsabilit\u00e0 \u00e8 chiara, ogni decisione \u00e8 supportata dai dati.",
  },
];

function MultiStoreSection() {
  return (
    <section id="multistore" className="relative py-20 sm:py-28 overflow-hidden" data-testid="section-multistore">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-yellow-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" data-testid="text-multistore-title">
              Multi-negozio reale, pensato per crescere
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              MonkeyPlan &egrave; progettato per funzionare davvero in contesti multi-store.
              Riducendo sprechi, fermi operativi e confusione.
            </p>

            <div className="space-y-4">
              {multiStorePoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3" data-testid={`item-multistore-${idx}`}>
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <point.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Store, value: "4", label: "Ruoli Distinti", gradient: "from-yellow-400/30", iconColor: "text-yellow-200", testId: "card-stat-roles" },
              { icon: Layers, value: "B2B", label: "Ordini Multi-Livello", gradient: "from-emerald-400/30", iconColor: "text-emerald-200", testId: "card-stat-b2b" },
              { icon: Truck, value: "Real-time", label: "Trasferimenti Interni", gradient: "from-orange-400/30", iconColor: "text-orange-200", testId: "card-stat-realtime" },
              { icon: CreditCard, value: "POS", label: "Fiscale Integrato", gradient: "from-cyan-400/30", iconColor: "text-cyan-200", testId: "card-stat-pos" },
            ].map((stat) => (
              <div key={stat.testId} className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 space-y-2" data-testid={stat.testId}>
                <div className={`p-2 rounded-xl ${stat.gradient} w-fit`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <p className="font-semibold text-2xl text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const integrations = [
  { name: "SIFAR", desc: "Ricambi e parti" },
  { name: "MobileSentrix", desc: "Componenti" },
  { name: "Foneday", desc: "Parti di ricambio" },
  { name: "Valutatore Usati", desc: "Valutazione device" },
  { name: "Sibill", desc: "Fatturazione" },
  { name: "PayPal", desc: "Pagamenti" },
  { name: "Stripe", desc: "Pagamenti" },
  { name: "Scalapay", desc: "Rate" },
  { name: "Fiskaly", desc: "RT Fiscale" },
];

function IntegrationsSection() {
  return (
    <section id="integrations" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-integrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-integrations-title">
            Integrazioni attive e sistema aperto
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            MonkeyPlan &egrave; integrabile con qualsiasi fornitore di prodotti e servizi.
            Nessun lock-in, nessun vincolo forzato. Si adatta al tuo ecosistema, non il contrario.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {integrations.map((integration) => (
            <Card
              key={integration.name}
              className="px-5 py-4 rounded-2xl flex items-center gap-3 hover-elevate"
              data-testid={`card-integration-${integration.name.toLowerCase()}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{integration.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{integration.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 max-w-xl mx-auto">
          Nuovi fornitori possono essere integrati tramite import/export, flussi operativi o API,
          in base alle disponibilit&agrave; del partner.
        </p>
      </div>
    </section>
  );
}

function OfferSection() {
  return (
    <section id="offer" className="relative py-20 sm:py-28 overflow-hidden" data-testid="section-offer">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-orange-400/25 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" data-testid="text-offer-title">
              Regaliamo le prime 100 licenze MonkeyPlan
            </h2>
            <p className="text-lg text-white/80">
              S&igrave;, le regaliamo davvero. Non &egrave; una promozione aggressiva. &Egrave; una scelta consapevole.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="leading-relaxed text-white/75">
              Crediamo in un mondo fatto di formazione reale, strumenti concreti e servizi incredibili.
              Un mondo in cui il tecnico &egrave; sempre pi&ugrave; preparato, efficiente e consapevole del proprio valore.
              Un mondo in cui il negoziante &egrave; pi&ugrave; organizzato, pi&ugrave; lucido nelle decisioni, pi&ugrave; libero
              di far crescere il proprio business.
            </p>

            <p className="leading-relaxed text-white/75">
              Un mondo in cui la tecnologia non complica, ma semplifica.
            </p>
          </div>

          <div className="border-t border-white/20 pt-8 space-y-4">
            <h3 className="text-xl font-semibold text-center text-white">Non vogliamo utenti. Vogliamo professionisti.</h3>

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {[
                "Tutte le funzionalit\u00e0, senza limitazioni",
                "Assistenza, magazzino, vendita, usato",
                "CRM, multi-negozio, scambi interni",
                "Integrazioni complete",
              ].map((item, idx) => (
                <div key={item} className="flex items-center gap-2" data-testid={`item-offer-feature-${idx}`}>
                  <CheckCircle className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span className="text-sm text-white/90">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-white/60 pt-2">
              Non &egrave; una demo. &Egrave; MonkeyPlan, utilizzato nel lavoro quotidiano.
            </p>
          </div>

          <div className="text-center space-y-3 pt-4">
            <p className="text-white/60 text-sm">
              Le licenze sono 100. La direzione &egrave; una sola. Il futuro lo costruiamo insieme.
            </p>
            <Link href="/auth">
              <Button size="lg" className="bg-white text-emerald-700 border-white/80 font-semibold shadow-lg shadow-emerald-900/20" data-testid="button-offer-cta">
                Richiedi la tua licenza gratuita
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-vision">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-vision-title">
          Costruiamo insieme uno standard pi&ugrave; alto
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Chi entra in questa prima fase non &egrave; un semplice utilizzatore,
          ma parte attiva di un progetto pi&ugrave; grande: alzare lo standard operativo
          dell'intero settore.
        </p>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Se condividi questa visione, se credi che metodo, formazione e strumenti
          giusti possano fare la differenza, allora sei nel posto giusto.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/auth">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-emerald-600 font-semibold shadow-lg shadow-emerald-500/25" data-testid="button-vision-cta">
              Unisciti al progetto
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-950" data-testid="footer-landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">MonkeyPlan</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">Beta v.24</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="text-footer-tagline">
            Il gestionale operativo per assistenza tecnica, retail telefonia e rivendita usato.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <MultiStoreSection />
      <IntegrationsSection />
      <OfferSection />
      <VisionSection />
      <Footer />
    </div>
  );
}
