import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UtilityService, UtilitySupplier } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Package, ArrowLeft, Building2, Euro, Percent, TrendingUp, 
  Zap, Star, LayoutGrid, TableIcon, Trophy, Sparkles, Calculator,
  ArrowRight, Phone, Lightbulb, Flame, Radio, MoreHorizontal, FileCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { UtilityPracticeWizard } from "@/components/UtilityPracticeWizard";
import { UtilityServiceDetailSheet } from "@/components/UtilityServiceDetailSheet";
import { useTranslation } from "react-i18next";

type ServiceCategory = "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro";

function getCategoryLabels(t: (key: string) => string): Record<ServiceCategory, string> {
  return {
    fisso: t("utility.types.fisso"),
    mobile: t("utility.types.mobile"),
    centralino: t("utility.types.centralino"),
    luce: t("utility.types.luce"),
    gas: t("utility.types.gas"),
    altro: t("common.other"),
  };
}

const categoryColors: Record<ServiceCategory, string> = {
  fisso: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  mobile: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  centralino: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  luce: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  gas: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  altro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const categoryIcons: Record<ServiceCategory, typeof Phone> = {
  fisso: Phone,
  mobile: Radio,
  centralino: Phone,
  luce: Lightbulb,
  gas: Flame,
  altro: MoreHorizontal,
};

const formatCurrency = (cents: number | null) => {
  if (cents === null) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const calculateCommission = (service: UtilityService): number => {
  let commission = 0;
  
  // Commissione fissa (per canone mensile)
  if (service.commissionFixed) {
    commission += service.commissionFixed / 100;
  }
  
  // Commissione una tantum (per attivazione)
  if (service.commissionOneTime) {
    commission += service.commissionOneTime / 100;
  }
  
  // Commissione percentuale: applica su prezzo mensile o, se assente, su costo attivazione
  if (service.commissionPercent) {
    const baseCents = service.monthlyPriceCents || service.activationFeeCents;
    if (baseCents) {
      commission += (baseCents / 100) * (service.commissionPercent / 100);
    }
  }
  
  return commission;
};

export default function ResellerUtilityServices() {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardServiceId, setWizardServiceId] = useState<string | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailServiceId, setDetailServiceId] = useState<string | null>(null);

  const handleCreatePractice = (serviceId: string) => {
    setWizardServiceId(serviceId);
    setWizardOpen(true);
  };

  const handleOpenDetail = (serviceId: string) => {
    setDetailServiceId(serviceId);
    setDetailOpen(true);
  };

  const { data: services = [], isLoading } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const activeServices = useMemo(() => 
    services.filter(s => s.isActive), 
    [services]
  );

  const topCommissionServices = useMemo(() => {
    return [...activeServices]
      .sort((a, b) => calculateCommission(b) - calculateCommission(a))
      .slice(0, 3);
  }, [activeServices]);

  const stats = useMemo(() => {
    const avgCommission = activeServices.length > 0
      ? activeServices.reduce((sum, s) => sum + calculateCommission(s), 0) / activeServices.length
      : 0;
    const maxCommission = activeServices.length > 0
      ? Math.max(...activeServices.map(s => calculateCommission(s)))
      : 0;
    const totalServices = activeServices.length;
    const categoriesCount = new Set(activeServices.map(s => s.category)).size;
    
    return { avgCommission, maxCommission, totalServices, categoriesCount };
  }, [activeServices]);

  const topServiceIds = useMemo(() => 
    new Set(topCommissionServices.map(s => s.id)), 
    [topCommissionServices]
  );

  const hasActiveFilters = searchQuery || supplierFilter !== "all" || categoryFilter !== "all";

  const filteredServices = activeServices.filter((service) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = supplierFilter === "all" || service.supplierId === supplierFilter;
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    const notInTopSection = hasActiveFilters || !topServiceIds.has(service.id);
    return matchesSearch && matchesSupplier && matchesCategory && notInTopSection;
  });

  const ServiceCard = ({ service, featured = false, onCreatePractice, onViewDetail }: { service: UtilityService; featured?: boolean; onCreatePractice?: (serviceId: string) => void; onViewDetail?: (serviceId: string) => void }) => {
    const supplier = suppliers.find(s => s.id === service.supplierId);
    const commission = calculateCommission(service);
    const CategoryIcon = categoryIcons[service.category] || Package;
    const potential10Sales = commission * 10;

    return (
      <Card 
        className={`rounded-2xl hover-elevate transition-all cursor-pointer ${featured ? 'border-primary/50 bg-primary/5' : ''}`}
        onClick={() => onViewDetail?.(service.id)}
        data-testid={`card-service-${service.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`p-2 rounded-lg ${categoryColors[service.category]}`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{service.name}</CardTitle>
                <CardDescription className="text-xs font-mono">{service.code}</CardDescription>
              </div>
            </div>
            {featured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                <Star className="h-3 w-3 mr-1" />
                Top
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {supplier?.name || t("common.supplier")}
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {service.monthlyPriceCents ? t("utility.monthlyPrice") : t("utility.activationCost")}
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(service.monthlyPriceCents || service.activationFeeCents)}
                </p>
              </div>
              <Badge className={categoryColors[service.category]}>
                {categoryLabels[service.category]}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{t("utility.yourCommission")}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(commission * 100)}
                </span>
                <span className="text-xs text-muted-foreground">{t("utility.perActivation")}</span>
              </div>
              {service.commissionPercent && (
                <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                  <Percent className="h-3 w-3" />
                  {service.commissionPercent}% {service.monthlyPriceCents ? t("utility.ofMonthlyFee") : t("utility.ofActivationCost")}
                </div>
              )}
            </div>

            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                <Calculator className="h-3 w-3 inline mr-1" />
{t("utility.earnings10Sales")}: <span className="font-semibold text-foreground">{formatCurrency(potential10Sales * 100)}</span>
              </p>
            </div>

            {onCreatePractice && (
              <Button 
                className="w-full gap-2" 
                onClick={(e) => { e.stopPropagation(); onCreatePractice(service.id); }}
                data-testid={`button-create-practice-${service.id}`}
              >
                <FileCheck className="h-4 w-4" />
                {t("utility.createPractice")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/reseller/utility">
              <Button variant="ghost" size="icon" className="text-white/80" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("utility.servicesTitle")}</h1>
              <p className="text-sm text-white/80">{t("utility.increaseEarnings")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("utility.availableServices")}</p>
                <p className="text-3xl font-bold">{stats.totalServices}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("utility.avgCommission")}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.avgCommission * 100)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("utility.maxCommission")}</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(stats.maxCommission * 100)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("common.categories")}</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.categoriesCount}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <LayoutGrid className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {topCommissionServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">{t("utility.mostProfitable")}</h2>
            <Badge variant="secondary" className="ml-2">{t("utility.topCommissions")}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCommissionServices.map((service) => (
              <ServiceCard key={service.id} service={service} featured onCreatePractice={handleCreatePractice} onViewDetail={handleOpenDetail} />
            ))}
          </div>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o codice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-services"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-supplier-filter">
                    <SelectValue placeholder={t("common.supplier")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("utility.allSuppliersFilter")}</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                    <SelectValue placeholder={t("common.category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("utility.allCategoriesFilter")}</SelectItem>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
                  <TabsList>
                    <TabsTrigger value="cards" className="gap-2" data-testid="toggle-cards-view">
                      <LayoutGrid className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2" data-testid="toggle-table-view">
                      <TableIcon className="h-4 w-4" />
                      Tabella
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("utility.noServiceFound")}</p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} onCreatePractice={handleCreatePractice} onViewDetail={handleOpenDetail} />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.code")}</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.supplier")}</TableHead>
                  <TableHead>{t("common.category")}</TableHead>
                  <TableHead>{t("utility.monthlyPrice")}</TableHead>
                  <TableHead>{t("utility.commission")}</TableHead>
                  <TableHead>{t("utility.earnings10Sales")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const supplier = suppliers.find(s => s.id === service.supplierId);
                  const commission = calculateCommission(service);
                  return (
                    <TableRow key={service.id} className="cursor-pointer" onClick={() => handleOpenDetail(service.id)} data-testid={`row-service-${service.id}`}>
                      <TableCell className="font-mono text-sm">
                        {service.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        {supplier ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {supplier.name}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[service.category]}>
                          {categoryLabels[service.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(service.monthlyPriceCents)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(commission * 100)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {formatCurrency(commission * 10 * 100)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); handleCreatePractice(service.id); }} data-testid={`button-create-practice-table-${service.id}`}>
                          <FileCheck className="h-3 w-3" />
                          {t("utility.createPractice")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UtilityPracticeWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setWizardServiceId(undefined);
        }}
        preselectedServiceId={wizardServiceId}
      />

      <UtilityServiceDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        service={services.find(s => s.id === detailServiceId) || null}
        supplier={suppliers.find(s => s.id === services.find(sv => sv.id === detailServiceId)?.supplierId) || null}
        onCreatePractice={handleCreatePractice}
      />
    </div>
  );
}
