import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, Wrench, Euro, Search, Users, Building2 } from "lucide-react";
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
import type { PriceList, PriceListItem, Product, ServiceItem, User } from "@shared/schema";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type PriceListWithItems = PriceList & { items: PriceListItem[] };

export default function AdminPriceListDetail() {
  const [, params] = useRoute("/admin/price-lists/:id");
  const listId = params?.id;
  const [search, setSearch] = useState("");

  const { data: priceList, isLoading } = useQuery<PriceListWithItems>({
    queryKey: ["/api/admin/price-lists", listId],
    enabled: !!listId,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: services } = useQuery<ServiceItem[]>({
    queryKey: ["/api/service-items"],
  });

  const { data: owner } = useQuery<User>({
    queryKey: ["/api/users", priceList?.ownerId],
    enabled: !!priceList?.ownerId,
  });

  const getItemName = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.name || "Prodotto sconosciuto";
    }
    if (item.serviceItemId) {
      const service = services?.find(s => s.id === item.serviceItemId);
      return service?.name || "Servizio sconosciuto";
    }
    return "Sconosciuto";
  };

  const getItemType = (item: PriceListItem) => {
    return item.productId ? "product" : "service";
  };

  const getItemImage = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.imageUrl || null;
    }
    return null;
  };

  const getItemOriginalPrice = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.unitPrice || null;
    }
    if (item.serviceItemId) {
      const service = services?.find(s => s.id === item.serviceItemId);
      return service?.defaultPriceCents || null;
    }
    return null;
  };

  const filteredItems = priceList?.items?.filter(item => {
    const name = getItemName(item).toLowerCase();
    return name.includes(search.toLowerCase());
  }) || [];

  const getTargetAudienceLabel = (target: string | null) => {
    switch (target) {
      case "all": return "Tutti";
      case "sub_reseller": return "Sub-Rivenditori";
      case "repair_center": return "Centri Riparazione";
      case "customer": return "Clienti";
      case "reseller": return "Rivenditori";
      default: return "Tutti";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p className="text-muted-foreground">Listino non trovato</p>
        <Link href="/admin/price-lists">
          <Button variant="ghost">Torna ai listini</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/price-lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-list-name">{priceList.name}</h1>
            {priceList.description && (
              <p className="text-muted-foreground">{priceList.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {getTargetAudienceLabel(priceList.targetAudience)}
          </Badge>
          <Badge variant={priceList.isActive ? "default" : "secondary"}>
            {priceList.isActive ? "Attivo" : "Disattivato"}
          </Badge>
        </div>
      </div>

      {owner && (
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Proprietario: {owner.fullName}</p>
                <p className="text-xs text-muted-foreground">{owner.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-500" />
                Voci del Listino
              </CardTitle>
              <CardDescription>
                {filteredItems.length} voci nel listino (sola lettura)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
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
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna voce nel listino</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Prezzo Originale</TableHead>
                  <TableHead className="text-right">Prezzo Listino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const imageUrl = getItemImage(item);
                  const originalPrice = getItemOriginalPrice(item);
                  const isProduct = getItemType(item) === "product";
                  return (
                    <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : isProduct ? (
                            <Package className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Wrench className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{getItemName(item)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {isProduct ? (
                            <><Package className="h-3 w-3 mr-1" /> Prodotto</>
                          ) : (
                            <><Wrench className="h-3 w-3 mr-1" /> Servizio</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {originalPrice ? formatCurrency(originalPrice) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.priceCents)}
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
