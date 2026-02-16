import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wrench, Euro, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServiceItem } from "@shared/schema";
import { useTranslation } from "react-i18next";

function getServiceCategories(t: (key: string) => string) {
  return [
    { value: "display", label: "Display" },
    { value: "batteria", label: "Batteria" },
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "diagnostica", label: "Diagnostica" },
    { value: "altro", label: t("common.other") },
  ];
}

const getCategoryLabel = (category: string, categories: { value: string; label: string }[]) => {
  return categories.find(c => c.value === category)?.label || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    display: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    batteria: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    software: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    hardware: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    diagnostica: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    altro: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return colors[category] || colors.altro;
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const getPriceSourceLabel = (source: string) => {
  switch (source) {
    case 'price_list': return 'Listino';
    case 'reseller': return 'Rivenditore';
    case 'base': return 'Base';
    default: return source;
  }
};

const getPriceSourceColor = (source: string) => {
  switch (source) {
    case 'price_list': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'reseller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'base': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

interface ServiceCatalogItem extends ServiceItem {
  effectivePrice: number;
  effectiveLaborMinutes: number;
  priceSource: 'base' | 'reseller' | 'price_list';
}

export default function SubResellerServiceCatalog() {
  const { t } = useTranslation();
  const SERVICE_CATEGORIES = getServiceCategories(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/sub-reseller/service-catalog"],
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("sidebar.items.serviceCatalog")}</h1>
            <p className="text-muted-foreground">
              Prezzi dal listino del tuo rivenditore
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t("common.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, codice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-services"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category">
                <SelectValue placeholder={t("common.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {SERVICE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.code")}</TableHead>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.category")}</TableHead>
                <TableHead className="text-right">{t("common.price")}</TableHead>
                <TableHead className="text-right">Tempo (min)</TableHead>
                <TableHead>Fonte Prezzo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nessun servizio trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} data-testid={`row-service-${item.id}`}>
                    <TableCell className="font-mono text-sm">
                      {item.code || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(item.category)}>
                        {getCategoryLabel(item.category, SERVICE_CATEGORIES)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formatCurrency(item.effectivePrice)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{item.effectiveLaborMinutes}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriceSourceColor(item.priceSource)}>
                        {getPriceSourceLabel(item.priceSource)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Totale: {filteredItems.length} servizi
      </div>
    </div>
  );
}
