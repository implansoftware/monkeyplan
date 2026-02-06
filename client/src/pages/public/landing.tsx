import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Package,
  ShoppingCart,
  Smartphone,
  Users,
  Building2,
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
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[999] border-b bg-background/80 backdrop-blur-md" data-testid="navbar-landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 h-16">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight" data-testid="text-brand">MonkeyPlan</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground transition-colors" data-testid="link-nav-features">Funzionalità</a>
            <a href="#multistore" className="text-sm text-muted-foreground transition-colors" data-testid="link-nav-multistore">Multi-Negozio</a>
            <a href="#integrations" className="text-sm text-muted-foreground transition-colors" data-testid="link-nav-integrations">Integrazioni</a>
            <a href="#offer" className="text-sm text-muted-foreground transition-colors" data-testid="link-nav-offer">100 Licenze</a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="outline" size="sm" data-testid="button-login">
                Accedi
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" data-testid="button-register">
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
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-2">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground" data-testid="link-mobile-features">Funzionalità</a>
          <a href="#multistore" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground" data-testid="link-mobile-multistore">Multi-Negozio</a>
          <a href="#integrations" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground" data-testid="link-mobile-integrations">Integrazioni</a>
          <a href="#offer" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground" data-testid="link-mobile-offer">100 Licenze</a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 dark:from-primary/10 dark:to-primary/5" />
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 -right-32 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="text-xs font-medium">
            Beta v.24
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
            Il gestionale operativo per{" "}
            <span className="font-extrabold underline decoration-foreground/30 decoration-2 underline-offset-4">assistenza tecnica</span>,{" "}
            retail telefonia e rivendita usato
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Un software gestionale completo pensato per chi lavora ogni giorno sul campo:
            centri di assistenza, negozi di telefonia, rivendita di dispositivi usati
            e reti multi-negozio.
          </p>

          <p className="text-sm text-muted-foreground">
            Nasce dall'esperienza reale di chi conosce i problemi quotidiani del settore
            e ha deciso di trasformarli in processi chiari, standardizzati e scalabili.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/auth">
              <Button size="lg" data-testid="button-hero-cta">
                Inizia Ora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#features" data-testid="link-hero-features">
              <Button variant="outline" size="lg" data-testid="button-hero-features">
                Scopri le funzionalità
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Wrench,
    title: "Assistenza Tecnica",
    description:
      "Accettazione, diagnosi, preventivo, approvazione cliente, lavorazione, test, consegna e storico completo di clienti e dispositivi.",
  },
  {
    icon: Package,
    title: "Magazzino e Ricambi",
    description:
      "Carichi e scarichi, compatibilità, resi, fornitori, DDT, costi e marginalità sempre sotto controllo.",
  },
  {
    icon: ShoppingCart,
    title: "Vendita e Cassa",
    description:
      "Documenti, incassi, pagamenti digitali, rate e cross-selling di accessori e servizi. POS fiscale integrato.",
  },
  {
    icon: Smartphone,
    title: "Usato e Permute",
    description:
      "Valutazione dispositivi, ritiro, classificazione, ricondizionamento e rivendita con marginalità reale per singolo device.",
  },
  {
    icon: Users,
    title: "CRM",
    description:
      "Clienti, consensi, dispositivi, comunicazioni e storico interazioni centralizzati in un unico punto.",
  },
  {
    icon: Shield,
    title: "Garanzie e Assicurazioni",
    description:
      "Catalogo garanzie multi-tenant, offerta durante l'accettazione, storico cliente e analytics dedicate.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28" data-testid="section-features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-features-title">
            Un unico sistema, tutti i servizi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            MonkeyPlan non è un semplice programma di ticketing. È una piattaforma operativa
            integrata che unisce in un solo ambiente tutto ciò che serve per lavorare bene.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 space-y-3 hover-elevate" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="w-10 h-10 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
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
    text: "Gestisci più punti vendita da un unico sistema, con ruoli e permessi differenziati.",
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
    text: "Ogni movimento è registrato, ogni responsabilità è chiara, ogni decisione è supportata dai dati.",
  },
];

function MultiStoreSection() {
  return (
    <section id="multistore" className="py-20 sm:py-28 bg-muted/30" data-testid="section-multistore">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-multistore-title">
              Multi-negozio reale, pensato per crescere
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              MonkeyPlan è progettato per funzionare davvero in contesti multi-store.
              Riducendo sprechi, fermi operativi e confusione.
            </p>

            <div className="space-y-4">
              {multiStorePoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3" data-testid={`item-multistore-${idx}`}>
                  <div className="w-8 h-8 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <point.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <p className="text-sm leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 space-y-2" data-testid="card-stat-roles">
              <Store className="w-6 h-6 text-foreground" />
              <p className="font-semibold text-2xl">4</p>
              <p className="text-xs text-muted-foreground">Ruoli Distinti</p>
            </Card>
            <Card className="p-5 space-y-2" data-testid="card-stat-b2b">
              <Layers className="w-6 h-6 text-foreground" />
              <p className="font-semibold text-2xl">B2B</p>
              <p className="text-xs text-muted-foreground">Ordini Multi-Livello</p>
            </Card>
            <Card className="p-5 space-y-2" data-testid="card-stat-realtime">
              <Truck className="w-6 h-6 text-foreground" />
              <p className="font-semibold text-2xl">Real-time</p>
              <p className="text-xs text-muted-foreground">Trasferimenti Interni</p>
            </Card>
            <Card className="p-5 space-y-2" data-testid="card-stat-pos">
              <CreditCard className="w-6 h-6 text-foreground" />
              <p className="font-semibold text-2xl">POS</p>
              <p className="text-xs text-muted-foreground">Fiscale Integrato</p>
            </Card>
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
    <section id="integrations" className="py-20 sm:py-28" data-testid="section-integrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-integrations-title">
            Integrazioni attive e sistema aperto
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            MonkeyPlan è integrabile con qualsiasi fornitore di prodotti e servizi.
            Nessun lock-in, nessun vincolo forzato. MonkeyPlan si adatta al tuo ecosistema, non il contrario.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {integrations.map((integration) => (
            <Card key={integration.name} className="px-5 py-4 flex items-center gap-3 hover-elevate" data-testid={`card-integration-${integration.name.toLowerCase()}`}>
              <Globe className="w-5 h-5 text-foreground shrink-0" />
              <div>
                <p className="font-semibold text-sm">{integration.name}</p>
                <p className="text-xs text-muted-foreground">{integration.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          Nuovi fornitori possono essere integrati tramite import/export, flussi operativi o API,
          in base alle disponibilità del partner.
        </p>
      </div>
    </section>
  );
}

function OfferSection() {
  return (
    <section id="offer" className="py-20 sm:py-28 bg-muted/30" data-testid="section-offer">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
              <Gift className="w-7 h-7 text-foreground" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-offer-title">
              Regaliamo le prime 100 licenze MonkeyPlan
            </h2>
            <p className="text-lg text-muted-foreground">
              Sì, le regaliamo davvero. Non è una promozione aggressiva. È una scelta consapevole.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="leading-relaxed text-muted-foreground">
              Crediamo in un mondo fatto di formazione reale, strumenti concreti e servizi incredibili.
              Un mondo in cui il tecnico è sempre più preparato, efficiente e consapevole del proprio valore.
              Un mondo in cui il negoziante è più organizzato, più lucido nelle decisioni, più libero
              di far crescere il proprio business.
            </p>

            <p className="leading-relaxed text-muted-foreground">
              Un mondo in cui la tecnologia non complica, ma semplifica.
            </p>
          </div>

          <div className="border-t pt-8 space-y-4">
            <h3 className="text-xl font-semibold text-center">Non vogliamo utenti. Vogliamo professionisti.</h3>

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {[
                "Tutte le funzionalità, senza limitazioni",
                "Assistenza, magazzino, vendita, usato",
                "CRM, multi-negozio, scambi interni",
                "Integrazioni complete",
              ].map((item, idx) => (
                <div key={item} className="flex items-center gap-2" data-testid={`item-offer-feature-${idx}`}>
                  <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Non è una demo. È MonkeyPlan, utilizzato nel lavoro quotidiano.
            </p>
          </div>

          <div className="text-center space-y-3 pt-4">
            <p className="text-muted-foreground text-sm">
              Le licenze sono 100. La direzione è una sola. Il futuro lo costruiamo insieme.
            </p>
            <Link href="/auth">
              <Button size="lg" data-testid="button-offer-cta">
                Richiedi la tua licenza gratuita
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="py-20 sm:py-28" data-testid="section-vision">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-vision-title">
          Costruiamo insieme uno standard più alto
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Chi entra in questa prima fase non è un semplice utilizzatore,
          ma parte attiva di un progetto più grande: alzare lo standard operativo
          dell'intero settore.
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Se condividi questa visione, se credi che metodo, formazione e strumenti
          giusti possano fare la differenza, allora sei nel posto giusto.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/auth">
            <Button size="lg" data-testid="button-vision-cta">
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
    <footer className="border-t py-8" data-testid="footer-landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">MonkeyPlan</span>
            <Badge variant="secondary" className="text-xs">Beta v.24</Badge>
          </div>

          <p className="text-xs text-muted-foreground" data-testid="text-footer-tagline">
            Il gestionale operativo per assistenza tecnica, retail telefonia e rivendita usato.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
