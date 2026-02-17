import { Link } from "wouter";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    { href: "/about", label: t("public.landing.nav.aboutUs"), isPage: true },
    { href: "/faq", label: t("public.landing.nav.faq"), isPage: true },
    { href: "/contact", label: t("public.landing.nav.contact"), isPage: true },
    { href: "/marketplace", label: t("public.landing.nav.marketplace"), isPage: true },
  ];
  const navLinks = allNavLinks;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${
        isSolid
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
      aria-label={t("public.landing.nav.ariaLabel")}
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
                  {t("public.landing.nav.goToDashboard")}
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
                    {t("public.landing.nav.login")}
                  </Button>
                </Link>
                <Link href="/auth" className="hidden md:inline-flex" data-testid="link-register">
                  <Button size="sm" data-testid="button-register">
                    {t("public.landing.nav.tryFree")}
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
                  {t("public.landing.nav.goToDashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} data-testid="link-mobile-login">
                  <Button variant="outline" className="w-full" data-testid="button-mobile-login">{t("public.landing.nav.login")}</Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)} data-testid="link-mobile-register">
                  <Button className="w-full" data-testid="button-mobile-register">
                    {t("public.landing.nav.tryFree")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
  const { t } = useTranslation();
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
                {t("public.landing.hero.active")}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-sm">
                <Star className="w-3 h-3" />
                {t("public.landing.hero.freeLicenses")}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] text-white" data-testid="text-hero-title">
              <span className="block">{t("public.landing.hero.titleLine1")}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                {t("public.landing.hero.titleLine2")}
              </span>
              <span className="block text-slate-300 font-semibold text-[0.72em]">{t("public.landing.hero.titleLine3")}</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed" data-testid="text-hero-subtitle">
              {t("public.landing.hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {user ? (
                <Link href={dashboardPath} className="w-full sm:w-auto" data-testid="link-hero-cta">
                  <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/25 text-base" data-testid="button-hero-cta">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t("public.landing.nav.goToDashboard")}
                  </Button>
                </Link>
              ) : (
                <Link href="/auth" className="w-full sm:w-auto" data-testid="link-hero-cta">
                  <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/25 text-base" data-testid="button-hero-cta">
                    {t("public.landing.hero.startFree")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
              <a href="#features" className="w-full sm:w-auto" data-testid="link-hero-features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/15 bg-white/5 backdrop-blur-sm" data-testid="button-hero-features">
                  {t("public.landing.hero.learnMore")}
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
              {[
                { value: "10+", label: t("public.landing.hero.statModules") },
                { value: "4", label: t("public.landing.hero.statRoles") },
                { value: "99.9%", label: t("public.landing.hero.statUptime") },
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
                      <span className="text-sm font-medium text-white" data-testid="text-dashboard-title">{t("public.landing.hero.dashboardLive")}</span>
                    </div>
                    <span className="text-xs text-slate-500" data-testid="text-dashboard-date">{t("public.landing.hero.today")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Wrench, label: t("public.landing.hero.repairs"), value: "24", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      { icon: Package, label: t("public.landing.hero.warehouse"), value: "1.2K", color: "text-cyan-400", bg: "bg-cyan-500/10" },
                      { icon: ShoppingCart, label: t("public.landing.hero.sales"), value: "18", color: "text-amber-400", bg: "bg-amber-500/10" },
                      { icon: TrendingUp, label: t("public.landing.hero.revenue"), value: "+12%", color: "text-teal-400", bg: "bg-teal-500/10" },
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
                      <span className="text-xs font-medium text-slate-400">{t("public.landing.hero.avgTime")}</span>
                    </div>
                    <p className="text-lg font-bold text-white">2.4h</p>
                    <div className="w-full h-1 rounded-full bg-white/10">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-400">{t("public.landing.hero.completed")}</span>
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
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();
  return (
    <section ref={ref} className="relative py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50" data-testid="section-trust">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { icon: Shield, value: 10, suffix: "+", label: t("public.landing.trust.operationalModules"), color: "text-emerald-600 dark:text-emerald-400" },
            { icon: Building2, value: 4, suffix: "", label: t("public.landing.trust.businessRoles"), color: "text-teal-600 dark:text-teal-400" },
            { icon: Globe, value: 9, suffix: "+", label: t("public.landing.trust.activeIntegrations"), color: "text-cyan-600 dark:text-cyan-400" },
            { icon: Zap, value: 100, suffix: "", label: t("public.landing.trust.freeLicenses"), color: "text-amber-600 dark:text-amber-400" },
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

const accentMap: Record<string, { iconBg: string; iconText: string }> = {
  emerald: { iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
  cyan: { iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15", iconText: "text-cyan-600 dark:text-cyan-400" },
  amber: { iconBg: "bg-amber-500/10 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-400" },
  orange: { iconBg: "bg-orange-500/10 dark:bg-orange-500/15", iconText: "text-orange-600 dark:text-orange-400" },
  teal: { iconBg: "bg-teal-500/10 dark:bg-teal-500/15", iconText: "text-teal-600 dark:text-teal-400" },
  blue: { iconBg: "bg-blue-500/10 dark:bg-blue-500/15", iconText: "text-blue-600 dark:text-blue-400" },
};

function FeaturesSection() {
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();

  const features = [
    {
      icon: Wrench,
      title: t("public.landing.features.repair.title"),
      description: t("public.landing.features.repair.description"),
      accent: "emerald",
    },
    {
      icon: Package,
      title: t("public.landing.features.warehouse.title"),
      description: t("public.landing.features.warehouse.description"),
      accent: "cyan",
    },
    {
      icon: ShoppingCart,
      title: t("public.landing.features.pos.title"),
      description: t("public.landing.features.pos.description"),
      accent: "amber",
    },
    {
      icon: Smartphone,
      title: t("public.landing.features.used.title"),
      description: t("public.landing.features.used.description"),
      accent: "orange",
    },
    {
      icon: Users,
      title: t("public.landing.features.crm.title"),
      description: t("public.landing.features.crm.description"),
      accent: "teal",
    },
    {
      icon: Shield,
      title: t("public.landing.features.warranty.title"),
      description: t("public.landing.features.warranty.description"),
      accent: "blue",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`max-w-2xl mx-auto text-center space-y-4 mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3 h-3" />
            {t("public.landing.features.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-features-title">
            {t("public.landing.features.titleLine1")}
            <span className="block text-slate-400 dark:text-slate-500">{t("public.landing.features.titleLine2")}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            {t("public.landing.features.subtitle")}
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
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();
  const steps = [
    { icon: FileText, label: t("public.landing.workflow.steps.acceptance.label"), desc: t("public.landing.workflow.steps.acceptance.desc") },
    { icon: Settings, label: t("public.landing.workflow.steps.diagnosis.label"), desc: t("public.landing.workflow.steps.diagnosis.desc") },
    { icon: CreditCard, label: t("public.landing.workflow.steps.quote.label"), desc: t("public.landing.workflow.steps.quote.desc") },
    { icon: Wrench, label: t("public.landing.workflow.steps.repair.label"), desc: t("public.landing.workflow.steps.repair.desc") },
    { icon: CheckCircle, label: t("public.landing.workflow.steps.test.label"), desc: t("public.landing.workflow.steps.test.desc") },
    { icon: Truck, label: t("public.landing.workflow.steps.delivery.label"), desc: t("public.landing.workflow.steps.delivery.desc") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/30" data-testid="section-workflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <RefreshCw className="w-3 h-3" />
              {t("public.landing.workflow.badge")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("public.landing.workflow.titleLine1")}
              <span className="block text-emerald-600 dark:text-emerald-400">{t("public.landing.workflow.titleLine2")}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
              {t("public.landing.workflow.subtitle")}
            </p>

            <div className="pt-2">
              <Link href="/auth" data-testid="link-workflow-cta">
                <Button variant="outline" data-testid="button-workflow-cta">
                  {t("public.landing.workflow.cta")}
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

function MultiStoreSection() {
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();

  const multiStorePoints = [
    { icon: Building2, title: t("public.landing.multistore.points.centralized.title"), text: t("public.landing.multistore.points.centralized.text") },
    { icon: Network, title: t("public.landing.multistore.points.autonomy.title"), text: t("public.landing.multistore.points.autonomy.text") },
    { icon: RefreshCw, title: t("public.landing.multistore.points.transfers.title"), text: t("public.landing.multistore.points.transfers.text") },
    { icon: BarChart3, title: t("public.landing.multistore.points.data.title"), text: t("public.landing.multistore.points.data.text") },
  ];

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
            {t("public.landing.multistore.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white" data-testid="text-multistore-title">
            {t("public.landing.multistore.titleLine1")}
            <span className="block text-slate-400">{t("public.landing.multistore.titleLine2")}</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            {t("public.landing.multistore.subtitle")}
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
            { icon: Store, value: "4", label: t("public.landing.multistore.stats.roles") },
            { icon: Layers, value: "B2B", label: t("public.landing.multistore.stats.orders") },
            { icon: Truck, value: "Real-time", label: t("public.landing.multistore.stats.transfers") },
            { icon: CreditCard, value: "POS", label: t("public.landing.multistore.stats.fiscal") },
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

function IntegrationsSection() {
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();

  const integrations = [
    { name: "SIFAR", desc: t("public.landing.integrations.items.sifar"), category: "supply" },
    { name: "MobileSentrix", desc: t("public.landing.integrations.items.mobilesentrix"), category: "supply" },
    { name: "Foneday", desc: t("public.landing.integrations.items.foneday"), category: "supply" },
    { name: "Valutatore Usati", desc: t("public.landing.integrations.items.valutatore"), category: "tools" },
    { name: "Sibill", desc: t("public.landing.integrations.items.sibill"), category: "finance" },
    { name: "PayPal", desc: t("public.landing.integrations.items.paypal"), category: "payments" },
    { name: "Stripe", desc: t("public.landing.integrations.items.stripe"), category: "payments" },
    { name: "Scalapay", desc: t("public.landing.integrations.items.scalapay"), category: "payments" },
    { name: "Fiskaly", desc: t("public.landing.integrations.items.fiskaly"), category: "fiscal" },
  ];

  return (
    <section id="integrations" className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-integrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`max-w-2xl mx-auto text-center space-y-4 mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Globe className="w-3 h-3" />
            {t("public.landing.integrations.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-integrations-title">
            {t("public.landing.integrations.titleLine1")}
            <span className="block text-slate-400 dark:text-slate-500">{t("public.landing.integrations.titleLine2")}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            {t("public.landing.integrations.subtitle")}
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
          {t("public.landing.integrations.footer")}
        </p>
      </div>
    </section>
  );
}

function OfferSection() {
  const { t } = useTranslation();
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
            {t("public.landing.offer.badge")}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight" data-testid="text-offer-title">
            {t("public.landing.offer.titleLine1")}
            <span className="block">{t("public.landing.offer.titleLine2")}</span>
          </h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t("public.landing.offer.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
          {[
            t("public.landing.offer.features.allFeatures"),
            t("public.landing.offer.features.repairWarehouseSales"),
            t("public.landing.offer.features.crmMultistore"),
            t("public.landing.offer.features.integrationsPOS"),
            t("public.landing.offer.features.b2bInvoicing"),
            t("public.landing.offer.features.warranties"),
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
                {t("public.landing.nav.goToDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth" data-testid="link-offer-cta">
                <Button size="lg" className="bg-white text-emerald-700 border-white font-semibold shadow-xl shadow-emerald-900/20 text-base" data-testid="button-offer-cta">
                  {t("public.landing.offer.cta")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-sm text-white/50">
                {t("public.landing.offer.noCreditCard")}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  const { t } = useTranslation();
  const { ref, isVisible } = useInView();
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-slate-950" data-testid="section-vision">
      <div ref={ref} className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="text-vision-title">
          {t("public.landing.vision.titleLine1")}
          <span className="block text-emerald-600 dark:text-emerald-400">{t("public.landing.vision.titleLine2")}</span>
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t("public.landing.vision.subtitle1")}
        </p>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {t("public.landing.vision.subtitle2")}
        </p>
        <div className="pt-4">
          {user ? (
            <Link href={dashboardPath} data-testid="link-vision-cta">
              <Button size="lg" data-testid="button-vision-cta">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {t("public.landing.nav.goToDashboard")}
              </Button>
            </Link>
          ) : (
            <Link href="/auth" data-testid="link-vision-cta">
              <Button size="lg" data-testid="button-vision-cta">
                {t("public.landing.vision.cta")}
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
  const { t } = useTranslation();
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
            <a href="#features" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-features">{t("public.landing.footer.features")}</a>
            <a href="#multistore" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-multistore">{t("public.landing.footer.multistore")}</a>
            <a href="#integrations" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-integrations">{t("public.landing.footer.integrations")}</a>
            <Link href="/marketplace" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-marketplace">{t("public.landing.footer.marketplace")}</Link>
            <Link href="/about" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-about">{t("public.landing.footer.aboutUs")}</Link>
            <Link href="/contact" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-contact">{t("public.landing.footer.contact")}</Link>
            <Link href="/faq" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-faq">{t("public.landing.footer.faq")}</Link>
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-terms">{t("public.landing.footer.terms")}</Link>
            <Link href="/privacy" className="text-xs text-slate-500 dark:text-slate-400 transition-colors" data-testid="link-footer-privacy">{t("public.landing.footer.privacy")}</Link>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500" data-testid="text-footer-tagline">
            {t("public.landing.footer.tagline")}
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
    "description": "First 100 licenses free",
    "availability": "https://schema.org/LimitedAvailability"
  },
  "featureList": [
    "Technical assistance and repair management",
    "Warehouse and spare parts with traceability",
    "Fiscal POS with Telematic Register",
    "Customer and device CRM",
    "Multi-level B2B orders",
    "Warranties and insurance",
    "Multi-store and multi-role",
    "Supplier integrations (SIFAR, Foneday, MobileSentrix)",
    "Automatic invoicing",
    "P2P Marketplace"
  ],
  "inLanguage": "en"
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
