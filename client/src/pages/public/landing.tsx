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
  Zap,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  Star,
  ArrowUpRight,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useInView(0.3);
  useEffect(() => {
    if (!isVisible) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function getDashboardPath(role?: string) {
  switch (role) {
    case "admin": case "admin_staff": return "/";
    case "reseller": case "reseller_staff": return "/reseller";
    case "repair_center": case "repair_center_staff": return "/repair-center";
    case "customer": return "/customer";
    default: return "/";
  }
}

export function Navbar({ solid = false, showLandingLinks = true }: { solid?: boolean; showLandingLinks?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  const isSolid = solid || scrolled;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const allNavLinks = [
    { href: "/about", label: "Chi Siamo", isPage: true },
    { href: "/faq", label: "FAQ", isPage: true },
    { href: "/contact", label: "Contatti", isPage: true },
    { href: "/marketplace", label: "Marketplace", isPage: true },
  ];
  const navLinks = allNavLinks;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${
        isSolid
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
      aria-label="Navigazione principale"
      data-testid="navbar-landing"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 h-16">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/landing">
              <div className="flex flex-wrap items-center gap-3 cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <span className={`text-lg font-bold tracking-tight transition-colors ${isSolid ? "text-slate-900 dark:text-white" : "text-white"}`} data-testid="text-brand">
                  MonkeyPlan
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              item.isPage ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSolid
                      ? "text-slate-600 dark:text-slate-400"
                      : "text-white/70"
                  }`}
                  data-testid={`link-nav-${item.href.slice(1)}`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSolid
                      ? "text-slate-600 dark:text-slate-400"
                      : "text-white/70"
                  }`}
                  data-testid={`link-nav-${item.href.slice(1)}`}
                >
                  {item.label}
                </a>
              )
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href={dashboardPath} className="hidden md:inline-flex" data-testid="link-dashboard">
                <Button size="sm" data-testid="button-dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Vai alla Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth" className="hidden md:inline-flex" data-testid="link-login">
                  <Button
                    variant="outline"
                    size="sm"
                    className={isSolid ? "" : "text-white border-white/30 bg-white/10 backdrop-blur-sm"}
                    data-testid="button-login"
                  >
                    Accedi
                  </Button>
                </Link>
                <Link href="/auth" className="hidden md:inline-flex" data-testid="link-register">
                  <Button size="sm" data-testid="button-register">
                    Prova Gratis
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className={`md:hidden ${isSolid ? "" : "text-white"}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((item) => (
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm text-slate-600 dark:text-slate-400"
                data-testid={`link-mobile-${item.href.slice(1)}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm text-slate-600 dark:text-slate-400"
                data-testid={`link-mobile-${item.href.slice(1)}`}
              >
                {item.label}
              </a>
            )
          ))}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <Link href={dashboardPath} onClick={() => setMobileOpen(false)} data-testid="link-mobile-dashboard">
                <Button className="w-full" data-testid="button-mobile-dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Vai alla Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} data-testid="link-mobile-login">
                  <Button variant="outline" className="w-full" data-testid="button-mobile-login">Accedi</Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)} data-testid="link-mobile-register">
                  <Button className="w-full" data-testid="button-mobile-register">
                    Prova Gratis <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-600/15 via-transparent to-transparent" />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }} />

      <div className="absolute top-20 right-[15%] w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="absolute bottom-20 left-[10%] w-96 h-96 rounded-full bg-teal-500/8 blur-[120px]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Attivo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-sm">
                <Star className="w-3 h-3" />
                100 Licenze Gratuite
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] text-white" data-testid="text-hero-title">
              <span className="block">Il gestionale</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                che ti serve
              </span>
              <span className="block text-slate-300 font-semibold text-[0.72em]">sul campo. Ogni giorno.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed" data-testid="text-hero-subtitle">
              Assistenza tecnica, retail telefonia, rivendita usato e reti multi-negozio.
              Un unico sistema per chi lavora davvero.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {user ? (
                <Link href={dashboardPath} className="w-full sm:w-auto" data-testid="link-hero-cta">
                  <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/25 text-base" data-testid="button-hero-cta">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Vai alla Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth" className="w-full sm:w-auto" data-testid="link-hero-cta">
                  <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/25 text-base" data-testid="button-hero-cta">
                    Inizia Gratis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
              <a href="#features" className="w-full sm:w-auto" data-testid="link-hero-features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/15 bg-white/5 backdrop-blur-sm" data-testid="button-hero-features">
                  Scopri di pi&ugrave;
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
              {[
                { value: "10+", label: "Moduli integrati" },
                { value: "4", label: "Ruoli distinti" },
                { value: "99.9%", label: "Uptime garantito" },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left" data-testid={`stat-hero-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block" data-testid="hero-mascot-area">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-white" data-testid="text-dashboard-title">Dashboard Live</span>
                    </div>
                    <span className="text-xs text-slate-500" data-testid="text-dashboard-date">Oggi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Wrench, label: "Riparazioni", value: "24", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      { icon: Package, label: "Magazzino", value: "1.2K", color: "text-cyan-400", bg: "bg-cyan-500/10" },
                      { icon: ShoppingCart, label: "Vendite", value: "18", color: "text-amber-400", bg: "bg-amber-500/10" },
                      { icon: TrendingUp, label: "Fatturato", value: "+12%", color: "text-teal-400", bg: "bg-teal-500/10" },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <p className="text-xl font-bold text-white">{item.value}</p>
                        <p className="text-[11px] text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-400">Tempo medio</span>
                    </div>
                    <p className="text-lg font-bold text-white">2.4h</p>
                    <div className="w-full h-1 rounded-full bg-white/10">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-400">Completate</span>
                    </div>
                    <p className="text-lg font-bold text-white">96%</p>
                    <div className="w-full h-1 rounded-full bg-white/10">
                      <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
    </section>
  );
}

function TrustBar() {
  const { ref, isVisible } = useInView();
  return (
    <section ref={ref} className="relative py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50" data-testid="section-trust">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { icon: Shield, value: 10, suffix: "+", label: "Moduli operativi", color: "text-emerald-600 dark:text-emerald-400" },
            { icon: Building2, value: 4, suffix: "", label: "Ruoli aziendali", color: "text-teal-600 dark:text-teal-400" },
            { icon: Globe, value: 9, suffix: "+", label: "Integrazioni attive", color: "text-cyan-600 dark:text-cyan-400" },
            { icon: Zap, value: 100, suffix: "", label: "Licenze gratuite", color: "text-amber-600 dark:text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4" data-testid={`stat-trust-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter target={item.value} suffix={item.suffix} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Wrench,
    title: "Assistenza Tecnica",
    description: "Workflow completo: accettazione, diagnosi, preventivo, approvazione, lavorazione, test, consegna. Ogni riparazione tracciata e documentata.",
    accent: "emerald",
  },
  {
    icon: Package,
    title: "Magazzino e Ricambi",
    description: "Carichi, scarichi, compatibilità, resi, fornitori, DDT. Costi e marginalità sempre sotto controllo con tracciabilità completa.",
    accent: "cyan",
  },
  {
    icon: ShoppingCart,
    title: "Vendita e POS Fiscale",
    description: "POS integrato con RT fiscale, multi-aliquota IVA, corrispettivi, codice lotteria. Incassi, pagamenti digitali e rate.",
    accent: "amber",
  },
  {
    icon: Smartphone,
    title: "Usato e Permute",
    description: "Valutazione dispositivi, ritiro, classificazione, ricondizionamento e rivendita con marginalità reale per singolo device.",
    accent: "orange",
  },
  {
    icon: Users,
    title: "CRM Clienti",
    description: "Clienti, consensi, dispositivi, comunicazioni e storico interazioni. Tutto centralizzato in un unico punto.",
    accent: "teal",
  },
  {
    icon: Shield,
    title: "Garanzie e Assicurazioni",
    description: "Catalogo multi-tenant, offerta durante l'accettazione, storico cliente, analytics dedicate e fatturazione automatica.",
    accent: "blue",
  },
];

const accentMap: Record<string, { iconBg: string; iconText: string }> = {
  emerald: { iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
  cyan: { iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15", iconText: "text-cyan-600 dark:text-cyan-400" },
  amber: { iconBg: "bg-amber-500/10 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-400" },
  orange: { iconBg: "bg-orange-500/10 dark:bg-orange-500/15", iconText: "text-orange-600 dark:text-orange-400" },
  teal: { iconBg: "bg-teal-500/10 dark:bg-teal-500/15", iconText: "text-teal-600 dark:text-teal-400" },
  blue: { iconBg: "bg-blue-500/10 dark:bg-blue-500/15", iconText: "text-blue-600 dark:text-blue-400" },
};

function FeaturesSection() {
  const { ref, isVisible } = useInView();
  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`max-w-2xl mx-auto text-center space-y-4 mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3 h-3" />
            Piattaforma All-in-One
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-features-title">
            Tutto quello che serve.
            <span className="block text-slate-400 dark:text-slate-500">Niente di superfluo.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Non un semplice ticketing. Una piattaforma operativa integrata che unisce
            in un solo ambiente tutto il necessario per lavorare bene.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((feature, idx) => {
            const colors = accentMap[feature.accent];
            return (
              <Card
                key={feature.title}
                className="p-6 rounded-2xl hover-elevate"
                style={{ transitionDelay: `${idx * 50}ms` }}
                data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                    <feature.icon className={`w-5 h-5 ${colors.iconText}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const { ref, isVisible } = useInView();
  const steps = [
    { icon: FileText, label: "Accettazione", desc: "Presa in carico con dati dispositivo e cliente" },
    { icon: Settings, label: "Diagnosi", desc: "Analisi tecnica del problema" },
    { icon: CreditCard, label: "Preventivo", desc: "Costo stimato con approvazione cliente" },
    { icon: Wrench, label: "Riparazione", desc: "Lavorazione con log dettagliato" },
    { icon: CheckCircle, label: "Test & QC", desc: "Verifica qualità e funzionamento" },
    { icon: Truck, label: "Consegna", desc: "Restituzione e chiusura pratica" },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/30" data-testid="section-workflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <RefreshCw className="w-3 h-3" />
              Workflow Avanzato
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dalla presa in carico
              <span className="block text-emerald-600 dark:text-emerald-400">alla consegna.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
              Un flusso di lavoro in 10 stati che standardizza ogni riparazione.
              Nessun passaggio viene perso, ogni responsabilità è chiara.
            </p>

            <div className="pt-2">
              <Link href="/auth" data-testid="link-workflow-cta">
                <Button variant="outline" data-testid="button-workflow-cta">
                  Vedi come funziona
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className="relative p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-2"
                style={{ transitionDelay: `${idx * 80}ms` }}
                data-testid={`step-workflow-${idx}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-5 h-5 rounded-md flex items-center justify-center">{idx + 1}</span>
                  <step.icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const multiStorePoints = [
  { icon: Building2, title: "Punti vendita centralizzati", text: "Gestisci più sedi da un unico sistema con ruoli e permessi differenziati per ogni operatore." },
  { icon: Network, title: "Autonomia locale", text: "Controllo centrale e autonomia operativa locale. Ogni sede lavora in modo indipendente." },
  { icon: RefreshCw, title: "Trasferimenti tracciati", text: "Scambi interni di ricambi, dispositivi e accessori tracciati, verificabili e ordinati." },
  { icon: BarChart3, title: "Dati per decidere", text: "Ogni movimento è registrato, ogni decisione è supportata dai dati. Report e analytics in tempo reale." },
];

function MultiStoreSection() {
  const { ref, isVisible } = useInView();
  return (
    <section id="multistore" className="relative py-20 sm:py-28 overflow-hidden" data-testid="section-multistore">
      <div className="absolute inset-0 bg-slate-900 dark:bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-600/8 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }} />

      <div ref={ref} className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Network className="w-3 h-3" />
            Multi-Negozio
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white" data-testid="text-multistore-title">
            Pensato per crescere.
            <span className="block text-slate-400">Senza compromessi.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            MonkeyPlan è progettato per funzionare in contesti multi-store reali,
            riducendo sprechi, fermi operativi e confusione.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {multiStorePoints.map((point, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] space-y-3 transition-all duration-300"
              data-testid={`item-multistore-${idx}`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <point.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">{point.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Store, value: "4", label: "Ruoli Distinti" },
            { icon: Layers, value: "B2B", label: "Ordini Multi-Livello" },
            { icon: Truck, value: "Real-time", label: "Trasferimenti Interni" },
            { icon: CreditCard, value: "POS", label: "Fiscale Integrato" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <stat.icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-xl text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const integrations = [
  { name: "SIFAR", desc: "Ricambi e parti", category: "supply" },
  { name: "MobileSentrix", desc: "Componenti", category: "supply" },
  { name: "Foneday", desc: "Parti di ricambio", category: "supply" },
  { name: "Valutatore Usati", desc: "Valutazione device", category: "tools" },
  { name: "Sibill", desc: "Fatturazione", category: "finance" },
  { name: "PayPal", desc: "Pagamenti online", category: "payments" },
  { name: "Stripe", desc: "Pagamenti online", category: "payments" },
  { name: "Scalapay", desc: "Pagamenti a rate", category: "payments" },
  { name: "Fiskaly", desc: "RT Fiscale Cloud", category: "fiscal" },
];

function IntegrationsSection() {
  const { ref, isVisible } = useInView();
  return (
    <section id="integrations" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-integrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`max-w-2xl mx-auto text-center space-y-4 mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Globe className="w-3 h-3" />
            Ecosistema Aperto
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-integrations-title">
            Si integra col tuo mondo.
            <span className="block text-slate-400 dark:text-slate-500">Non il contrario.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Nessun lock-in, nessun vincolo forzato. MonkeyPlan si adatta al tuo
            ecosistema esistente di fornitori e servizi.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {integrations.map((integration) => (
            <Card
              key={integration.name}
              className="p-4 rounded-xl text-center space-y-2 hover-elevate"
              data-testid={`card-integration-${integration.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{integration.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{integration.desc}</p>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10 max-w-lg mx-auto">
          Nuovi fornitori possono essere integrati tramite import/export,
          flussi operativi o API.
        </p>
      </div>
    </section>
  );
}

function OfferSection() {
  const { ref, isVisible } = useInView();
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  return (
    <section id="offer" className="relative py-20 sm:py-28 overflow-hidden" data-testid="section-offer">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      }} />

      <div ref={ref} className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm border border-white/20">
            <Gift className="w-4 h-4" />
            Offerta Lancio
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight" data-testid="text-offer-title">
            Le prime 100 licenze
            <span className="block">sono gratuite. Davvero.</span>
          </h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Non è una promozione aggressiva. È una scelta consapevole. Crediamo che
            strumenti concreti e formazione reale possano cambiare il settore.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
          {[
            "Tutte le funzionalità, senza limitazioni",
            "Assistenza, magazzino, vendita, usato",
            "CRM, multi-negozio, scambi interni",
            "Integrazioni e POS fiscale completo",
            "Fatturazione automatica B2B",
            "Garanzie e assicurazioni integrate",
          ].map((item, idx) => (
            <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10" data-testid={`item-offer-feature-${idx}`}>
              <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
              <span className="text-sm text-white font-medium">{item}</span>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          {user ? (
            <Link href={dashboardPath} data-testid="link-offer-cta">
              <Button size="lg" className="bg-white text-emerald-700 border-white font-semibold shadow-xl shadow-emerald-900/20 text-base" data-testid="button-offer-cta">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Vai alla Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth" data-testid="link-offer-cta">
                <Button size="lg" className="bg-white text-emerald-700 border-white font-semibold shadow-xl shadow-emerald-900/20 text-base" data-testid="button-offer-cta">
                  Richiedi la tua licenza gratuita
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-sm text-white/50">
                Nessuna carta di credito richiesta. Accesso immediato a tutte le funzionalità.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  const { ref, isVisible } = useInView();
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-vision">
      <div ref={ref} className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-vision-title">
          Non vogliamo utenti.
          <span className="block text-emerald-600 dark:text-emerald-400">Vogliamo professionisti.</span>
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Chi entra in questa prima fase non è un semplice utilizzatore,
          ma parte attiva di un progetto più grande: alzare lo standard operativo
          dell'intero settore.
        </p>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Se credi che metodo, formazione e strumenti giusti possano fare la differenza,
          allora sei nel posto giusto.
        </p>
        <div className="pt-4">
          {user ? (
            <Link href={dashboardPath} data-testid="link-vision-cta">
              <Button size="lg" data-testid="button-vision-cta">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Vai alla Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth" data-testid="link-vision-cta">
              <Button size="lg" data-testid="button-vision-cta">
                Unisciti al progetto
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-slate-50 dark:bg-slate-900/50" role="contentinfo" data-testid="footer-landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">MonkeyPlan</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-features">Funzionalità</a>
            <a href="#multistore" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-multistore">Multi-Negozio</a>
            <a href="#integrations" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-integrations">Integrazioni</a>
            <Link href="/marketplace" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-marketplace">Marketplace</Link>
            <Link href="/about" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-about">Chi Siamo</Link>
            <Link href="/contact" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-contact">Contatti</Link>
            <Link href="/faq" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-faq">FAQ</Link>
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-terms">Termini</Link>
            <Link href="/privacy" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-privacy">Privacy</Link>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500" data-testid="text-footer-tagline">
            Il gestionale operativo per assistenza tecnica, retail e rivendita usato.
          </p>
        </div>
      </div>
    </footer>
  );
}

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MonkeyPlan",
  "url": "https://monkeyplan.replit.app",
  "logo": "https://monkeyplan.replit.app/favicon.svg",
  "description": "Software gestionale operativo per centri di assistenza tecnica, negozi di telefonia, rivendita usato e reti multi-negozio.",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["Italian"]
  }
};

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MonkeyPlan",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Gestionale operativo per assistenza tecnica, retail telefonia e rivendita usato. Ticketing, magazzino, POS fiscale, CRM, B2B e integrazioni complete.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Prime 100 licenze gratuite",
    "availability": "https://schema.org/LimitedAvailability"
  },
  "featureList": [
    "Gestione assistenza tecnica e riparazioni",
    "Magazzino e ricambi con tracciabilità",
    "POS fiscale con Registratore Telematico",
    "CRM clienti e dispositivi",
    "Ordini B2B multi-livello",
    "Garanzie e assicurazioni",
    "Multi-negozio e multi-ruolo",
    "Integrazioni fornitori (SIFAR, Foneday, MobileSentrix)",
    "Fatturazione automatica",
    "Marketplace P2P"
  ],
  "inLanguage": "it"
};

const jsonLdWebPage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "MonkeyPlan - Gestionale per Assistenza Tecnica, Retail Telefonia e Rivendita Usato",
  "description": "Il software gestionale completo pensato per centri di assistenza, negozi di telefonia, rivendita usato e reti multi-negozio.",
  "url": "https://monkeyplan.replit.app",
  "inLanguage": "it",
  "isPartOf": {
    "@type": "WebSite",
    "name": "MonkeyPlan",
    "url": "https://monkeyplan.replit.app"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://monkeyplan.replit.app"
      }
    ]
  }
};

export default function LandingPage() {
  usePageTitle();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white" itemScope itemType="https://schema.org/WebPage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }} />
      <Navbar />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <WorkflowSection />
      <MultiStoreSection />
      <IntegrationsSection />
      <OfferSection />
      <VisionSection />
      <Footer />
    </div>
  );
}
