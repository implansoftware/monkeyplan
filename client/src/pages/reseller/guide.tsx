import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Wrench, 
  Package, 
  FileText, 
  Warehouse, 
  Truck,
  ShoppingCart,
  Store,
  Zap,
  Building,
  Settings,
  CreditCard,
  Shield,
  BarChart3,
  Link2,
  Calendar,
  RefreshCcw,
  PackageCheck,
  LayoutDashboard
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface GuideSectionProps {
  icon: typeof Users;
  title: string;
  description: string;
  features: string[];
}

function GuideSection({ icon: Icon, title, description, features }: GuideSectionProps) {
  return (
    <Card className="rounded-2xl" data-testid={`card-guide-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ResellerGuide() {
  const { t } = useTranslation();
  const sections: GuideSectionProps[] = [
    {
      icon: LayoutDashboard,
      title: t("guide.dashboard.title"),
      description: t("guide.dashboard.description"),
      features: [
        t("guide.dashboard.f1"),
        t("guide.dashboard.f2"),
        t("guide.dashboard.f3"),
        t("guide.dashboard.f4"),
      ]
    },
    {
      icon: Users,
      title: t("guide.customers.title"),
      description: t("guide.customers.description"),
      features: [
        t("guide.customers.f1"),
        t("guide.customers.f2"),
        t("guide.customers.f3"),
        t("guide.customers.f4"),
      ]
    },
    {
      icon: Building,
      title: t("admin.repairCenters.title"),
      description: t("guide.repairCenters.description"),
      features: [
        t("guide.repairCenters.f1"),
        t("guide.repairCenters.f2"),
        t("guide.repairCenters.f3"),
        t("guide.repairCenters.f4"),
      ]
    },
    {
      icon: Wrench,
      title: t("sidebar.items.jobs"),
      description: t("guide.repairs.description"),
      features: [
        t("guide.repairs.f1"),
        t("guide.repairs.f2"),
        t("guide.repairs.f3"),
        t("guide.repairs.f4"),
        t("guide.repairs.f5"),
      ]
    },
    {
      icon: Shield,
      title: t("guide.warranties.title"),
      description: t("guide.warranties.description"),
      features: [
        t("guide.warranties.f1"),
        t("guide.warranties.f2"),
        t("guide.warranties.f3"),
        t("guide.warranties.f4"),
        t("guide.warranties.f5"),
      ]
    },
    {
      icon: Warehouse,
      title: t("warehouse.title"),
      description: t("guide.warehouse.description"),
      features: [
        t("guide.warehouse.f1"),
        t("guide.warehouse.f2"),
        t("guide.warehouse.f3"),
        t("guide.warehouse.f4"),
        t("guide.warehouse.f5"),
      ]
    },
    {
      icon: RefreshCcw,
      title: t("guide.autoStock.title"),
      description: t("guide.autoStock.description"),
      features: [
        t("guide.autoStock.f1"),
        t("guide.autoStock.f2"),
        t("guide.autoStock.f3"),
        t("guide.autoStock.f4"),
        t("guide.autoStock.f5"),
      ]
    },
    {
      icon: Package,
      title: t("guide.parts.title"),
      description: t("guide.parts.description"),
      features: [
        t("guide.parts.f1"),
        t("guide.parts.f2"),
        t("guide.parts.f3"),
        t("guide.parts.f4"),
      ]
    },
    {
      icon: Link2,
      title: t("guide.supplierIntegrations.title"),
      description: t("guide.supplierIntegrations.description"),
      features: [
        t("guide.supplierIntegrations.f1"),
        t("guide.supplierIntegrations.f2"),
        t("guide.supplierIntegrations.f3"),
        t("guide.supplierIntegrations.f4"),
        t("guide.supplierIntegrations.f5"),
      ]
    },
    {
      icon: Truck,
      title: t("suppliers.title"),
      description: t("guide.suppliers.description"),
      features: [
        t("guide.suppliers.f1"),
        t("guide.suppliers.f2"),
        t("guide.suppliers.f3"),
        t("guide.suppliers.f4"),
      ]
    },
    {
      icon: FileText,
      title: t("settings.billing"),
      description: t("guide.billing.description"),
      features: [
        t("guide.billing.f1"),
        t("guide.billing.f2"),
        t("guide.billing.f3"),
        t("guide.billing.f4"),
        t("guide.billing.f5"),
      ]
    },
    {
      icon: BarChart3,
      title: "Sibill",
      description: t("guide.sibill.description"),
      features: [
        t("guide.sibill.f1"),
        t("guide.sibill.f2"),
        t("guide.sibill.f3"),
        t("guide.sibill.f4"),
      ]
    },
    {
      icon: Store,
      title: t("sidebar.sections.ecommerce"),
      description: t("guide.ecommerce.description"),
      features: [
        t("guide.ecommerce.f1"),
        t("guide.ecommerce.f2"),
        t("guide.ecommerce.f3"),
        t("guide.ecommerce.f4"),
        t("guide.ecommerce.f5"),
      ]
    },
    {
      icon: ShoppingCart,
      title: t("sidebar.sections.purchasesB2B"),
      description: t("guide.b2bPurchases.description"),
      features: [
        t("guide.b2bPurchases.f1"),
        t("guide.b2bPurchases.f2"),
        t("guide.b2bPurchases.f3"),
        t("guide.b2bPurchases.f4"),
        t("guide.b2bPurchases.f5"),
      ]
    },
    {
      icon: PackageCheck,
      title: t("guide.b2bCenterOrders.title"),
      description: t("guide.b2bCenterOrders.description"),
      features: [
        t("guide.b2bCenterOrders.f1"),
        t("guide.b2bCenterOrders.f2"),
        t("guide.b2bCenterOrders.f3"),
        t("guide.b2bCenterOrders.f4"),
        t("guide.b2bCenterOrders.f5"),
      ]
    },
    {
      icon: Calendar,
      title: t("guide.attendance.title"),
      description: t("guide.attendance.description"),
      features: [
        t("guide.attendance.f1"),
        t("guide.attendance.f2"),
        t("guide.attendance.f3"),
        t("guide.attendance.f4"),
      ]
    },
    {
      icon: Zap,
      title: t("utility.title"),
      description: t("guide.utility.description"),
      features: [
        t("guide.utility.f1"),
        t("guide.utility.f2"),
        t("guide.utility.f3"),
        t("guide.utility.f4"),
      ]
    },
    {
      icon: CreditCard,
      title: t("sidebar.items.payments"),
      description: t("guide.payments.description"),
      features: [
        t("guide.payments.f1"),
        t("guide.payments.f2"),
        t("guide.payments.f3"),
        t("guide.payments.f4"),
      ]
    },
    {
      icon: Settings,
      title: t("settings.title"),
      description: t("guide.settings.description"),
      features: [
        t("guide.settings.f1"),
        t("guide.settings.f2"),
        t("guide.settings.f3"),
        t("guide.settings.f4"),
        t("guide.settings.f5"),
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-reseller-guide">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-guide-title">{t("guide.pageTitle")}</h1>
              <p className="text-sm text-white/80" data-testid="text-guide-subtitle">{t("guide.pageSubtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <GuideSection key={section.title} {...section} />
        ))}
      </div>

      <Card className="bg-muted/50 rounded-2xl" data-testid="card-guide-support">
        <CardHeader>
          <CardTitle className="text-lg">{t("guide.needHelp")}</CardTitle>
          <CardDescription>
            {t("guide.needHelpDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("guide.needHelpContent")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
