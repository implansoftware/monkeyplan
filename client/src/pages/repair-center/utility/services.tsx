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
  Phone, Lightbulb, Flame, Radio, MoreHorizontal
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

type ServiceCategory = "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro";

const categoryLabels: Record<ServiceCategory, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

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
  
  if (service.commissionFixed) {
    commission += service.commissionFixed / 100;
  }
  
  if (service.commissionOneTime) {
    commission += service.commissionOneTime / 100;
  }
  
  if (service.commissionPercent) {
    const baseCents = service.monthlyPriceCents || service.activationFeeCents;
    if (baseCents) {
      commission += (baseCents / 100) * (service.commissionPercent / 100);
    }
  }
  
  return commission;
};

export default function RepairCenterUtilityServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

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

  const ServiceCard = ({ service, featured = false }: { service: UtilityService; featured?: boolean }) => {
    const supplier = suppliers.find(s => s.id === service.supplierId);
    const commission = calculateCommission(service);
    const CategoryIcon = categoryIcons[service.category] || Package;
    const potential10Sales = commission * 10;

    return (
      <Card className={`hover-elevate transition-all ${featured ? 'border-primary/50 bg-primary/5' : ''}`} data-testid={`card-service-${service.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {supplier?.name || "Fornitore"}
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {service.monthlyPriceCents ? "Prezzo mensile" : "Costo attivazione"}
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
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">La tua commissione</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(commission * 100)}
                </span>
                <span className="text-xs text-muted-foreground">per attivazione</span>
              </div>
              {service.commissionPercent && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                  <Percent className="h-3 w-3" />
                  {service.commissionPercent}% {service.monthlyPriceCents ? "del canone mensile" : "del costo attivazione"}
                </div>
              )}
            </div>

            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                <Calculator className="h-3 w-3 inline mr-1" />
                10 attivazioni = <span className="font-semibold text-foreground">{formatCurrency(potential10Sales * 100)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/repair-center/utility">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Servizi Utility</h1>
              <p className="text-sm text-muted-foreground">Aumenta i tuoi guadagni con i servizi utility</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" data-testid="stat-card-total-services">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servizi Disponibili</p>
                <p className="text-3xl font-bold" data-testid="stat-value-total-services">{stats.totalServices}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20" data-testid="stat-card-avg-commission">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commissione Media</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="stat-value-avg-commission">
                  {formatCurrency(stats.avgCommission * 100)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20" data-testid="stat-card-max-commission">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commissione Max</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="stat-value-max-commission">
                  {formatCurrency(stats.maxCommission * 100)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20" data-testid="stat-card-categories">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categorie</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-value-categories">
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
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">I Più Redditizi</h2>
            <Badge variant="secondary" className="ml-2">Top Commissioni</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCommissionServices.map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o codice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-services"
                />
              </div>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-40" data-testid="select-supplier-filter">
                  <SelectValue placeholder="Fornitore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i fornitori</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32" data-testid="select-category-filter">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <p className="text-muted-foreground">Nessun servizio trovato</p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prezzo Mensile</TableHead>
                  <TableHead>Commissione</TableHead>
                  <TableHead>Guadagno 10 Vendite</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const supplier = suppliers.find(s => s.id === service.supplierId);
                  const commission = calculateCommission(service);
                  return (
                    <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                      <TableCell className="font-mono text-sm">
                        {service.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        {supplier ? (
                          <div className="flex items-center gap-1">
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
                        <Button size="sm" variant="outline" className="gap-1" data-testid={`button-propose-table-${service.id}`}>
                          <Sparkles className="h-3 w-3" />
                          Proponi
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
    </div>
  );
}
