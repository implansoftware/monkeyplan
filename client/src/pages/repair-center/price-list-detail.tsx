import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, Wrench, Euro, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceList, PriceListItem } from "@shared/schema";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type EnrichedPriceListItem = PriceListItem & {
  productName?: string | null;
  serviceItemName?: string | null;
};

type PriceListWithItems = PriceList & { items: EnrichedPriceListItem[] };

export default function RepairCenterPriceListDetail() {
  const [, params] = useRoute("/repair-center/price-lists/:id");
  const listId = params?.id;
  const [search, setSearch] = useState("");

  const { data: priceList, isLoading } = useQuery<PriceListWithItems>({
    queryKey: ["/api/price-lists/inherited", listId],
    enabled: !!listId,
  });

  const filteredItems = priceList?.items?.filter(item => {
    const name = item.productName || item.serviceItemName || "";
    return name.toLowerCase().includes(search.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Listino non trovato</p>
            <Link href="/repair-center/price-lists">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai listini
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/repair-center/price-lists">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Euro className="h-6 w-6 text-emerald-500" />
              {priceList.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {priceList.description || "Listino prezzi del reseller"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Prezzi del Listino
              </CardTitle>
              <CardDescription>
                {filteredItems.length} voci nel listino
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotto/servizio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna voce nel listino</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                    <TableCell>
                      {item.productId ? (
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" />
                          Prodotto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Wrench className="h-3 w-3" />
                          Servizio
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.productName || item.serviceItemName || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatCurrency(item.priceCents)}
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
