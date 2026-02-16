import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WarrantyProduct } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const coverageLabels: Record<string, string> = {
  basic: "Base",
  extended: "Estesa",
  full: "Completa",
};

const coverageVariants: Record<string, "default" | "secondary" | "outline"> = {
  basic: "outline",
  extended: "secondary",
  full: "default",
};

export default function RepairCenterWarrantyProducts() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery<WarrantyProduct[]>({
    queryKey: ["/api/repair-center/warranty-products"],
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6" data-testid="page-rc-warranty-products">
      <div className="flex items-center gap-3 flex-wrap">
        <Shield className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Catalogo Garanzie</h1>
          <p className="text-sm text-muted-foreground">
            Garanzie disponibili dal tuo rivenditore
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-lg">Prodotti Garanzia</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca garanzie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-warranty"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-empty-state">
              {searchQuery
                ? "Nessuna garanzia trovata per la ricerca"
                : "Nessuna garanzia disponibile dal rivenditore"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Descrizione</TableHead>
                    <TableHead>Durata</TableHead>
                    <TableHead>Copertura</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="hidden md:table-cell">Franchigia</TableHead>
                    <TableHead className="hidden md:table-cell">Importo Max</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id} data-testid={`row-warranty-${product.id}`}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground max-w-[200px] truncate">
                        {product.description || "—"}
                      </TableCell>
                      <TableCell>
                        {product.durationMonths} {product.durationMonths === 1 ? "mese" : "mesi"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coverageVariants[product.coverageType] ?? "outline"}>
                          {coverageLabels[product.coverageType] ?? product.coverageType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {((product.priceInCents ?? 0) / 100).toFixed(2)} &euro;
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono">
                        {((product.deductibleAmount ?? 0) / 100).toFixed(2)} &euro;
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono">
                        {product.maxClaimAmount
                          ? `${(product.maxClaimAmount / 100).toFixed(2)} €`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
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
