import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UtilityService, UtilitySupplier } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Package, ArrowLeft, Building2, Euro, Percent
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

const formatCurrency = (cents: number | null) => {
  if (cents === null) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function ResellerUtilityServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const filteredServices = services.filter((service) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = supplierFilter === "all" || service.supplierId === supplierFilter;
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reseller/utility">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Listino Servizi Utility</h1>
            <p className="text-muted-foreground">
              Catalogo servizi dei fornitori
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessun servizio trovato</p>
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
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const supplier = suppliers.find(s => s.id === service.supplierId);
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
                        <div className="flex flex-col gap-0.5 text-sm">
                          {service.commissionPercent && (
                            <span className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {service.commissionPercent}%
                            </span>
                          )}
                          {service.commissionFixed && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {formatCurrency(service.commissionFixed)}
                            </span>
                          )}
                          {!service.commissionPercent && !service.commissionFixed && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
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
