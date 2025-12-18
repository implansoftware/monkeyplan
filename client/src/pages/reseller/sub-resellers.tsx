import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Network, Search, Users, Building, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface SubReseller {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone: string | null;
  resellerCategory: string | null;
  isActive: boolean;
  createdAt: string;
  customersCount: number;
  repairCentersCount: number;
}

const categoryLabels: Record<string, string> = {
  standard: "Standard",
  franchising: "Franchising",
  gdo: "GDO",
};

export default function SubResellers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subResellers = [], isLoading } = useQuery<SubReseller[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const filteredResellers = subResellers.filter((reseller) => {
    const matchesSearch =
      reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalCustomers = subResellers.reduce((acc, r) => acc + r.customersCount, 0);
  const totalCenters = subResellers.reduce((acc, r) => acc + r.repairCentersCount, 0);
  const activeResellers = subResellers.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Network className="h-6 w-6" />
            Sub-Reseller
          </h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi rivenditori affiliati
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Totale Sub-Reseller</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-subresellers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : subResellers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeResellers} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Centri Riparazione</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-centers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalCenters}
            </div>
            <p className="text-xs text-muted-foreground">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Attivi</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-resellers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${activeResellers}/${subResellers.length}`}
            </div>
            <p className="text-xs text-muted-foreground">
              sub-reseller attivi
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Elenco Sub-Reseller
          </CardTitle>
          <CardDescription>
            Visualizza tutti i rivenditori affiliati alla tua rete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, email o username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredResellers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nessun sub-reseller trovato</p>
              <p className="text-sm">
                {searchQuery
                  ? "Prova a modificare i criteri di ricerca"
                  : "Non hai ancora rivenditori affiliati"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Clienti</TableHead>
                    <TableHead className="text-center">Centri</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data Creazione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResellers.map((reseller) => (
                    <TableRow key={reseller.id} data-testid={`row-subreseller-${reseller.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${reseller.id}`}>
                        {reseller.fullName}
                      </TableCell>
                      <TableCell data-testid={`text-email-${reseller.id}`}>
                        {reseller.email}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${reseller.id}`}>
                        {reseller.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-category-${reseller.id}`}>
                          {categoryLabels[reseller.resellerCategory || "standard"] || reseller.resellerCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-customers-${reseller.id}`}>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {reseller.customersCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-centers-${reseller.id}`}>
                        <Badge variant="secondary">
                          <Building className="h-3 w-3 mr-1" />
                          {reseller.repairCentersCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={reseller.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${reseller.id}`}
                        >
                          {reseller.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-date-${reseller.id}`}>
                        {format(new Date(reseller.createdAt), "dd MMM yyyy", { locale: it })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
