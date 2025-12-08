import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Search, Building2, Globe, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  unitPrice: number;
  createdAt: string;
  isOwn?: boolean;
};

type RepairCenter = {
  id: string;
  name: string;
  city: string;
};

type InventoryWithDetails = {
  id: string;
  productId: string;
  repairCenterId: string;
  quantity: number;
  updatedAt: string;
  product: Product | null;
  repairCenter: RepairCenter | null;
};

type OwnershipFilter = "all" | "global" | "own";

export default function ResellerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/reseller/inventory"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const filteredInventory = inventory.filter((item) => {
    if (!item.product) return false;
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = centerFilter === "all" || item.repairCenterId === centerFilter;
    const matchesOwnership = 
      ownershipFilter === "all" ||
      (ownershipFilter === "own" && item.product.isOwn === true) ||
      (ownershipFilter === "global" && item.product.isOwn === false);
    return matchesSearch && matchesCenter && matchesOwnership;
  });

  const getLowStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Esaurito</Badge>;
    if (quantity < 5) return <Badge variant="secondary">Scorte basse</Badge>;
    return null;
  };

  const getOwnershipBadge = (isOwn: boolean | undefined) => {
    if (isOwn === true) {
      return (
        <Badge variant="default" className="gap-1">
          <User className="h-3 w-3" />
          Mio
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Globe className="h-3 w-3" />
        Catalogo
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const ownCount = inventory.filter(i => i.product?.isOwn === true).length;
  const globalCount = inventory.filter(i => i.product?.isOwn === false).length;

  if (inventoryLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Magazzino</h1>
          <p className="text-muted-foreground">
            Visualizza l'inventario dei tuoi centri riparazione
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Magazzino</h1>
        <p className="text-muted-foreground">
          Visualizza l'inventario dei tuoi centri riparazione
        </p>
      </div>

      <Tabs value={ownershipFilter} onValueChange={(v) => setOwnershipFilter(v as OwnershipFilter)}>
        <TabsList data-testid="tabs-ownership-filter">
          <TabsTrigger value="all" data-testid="tab-all">
            Tutti ({inventory.length})
          </TabsTrigger>
          <TabsTrigger value="own" data-testid="tab-own" className="gap-1">
            <User className="h-4 w-4" />
            I Miei Prodotti ({ownCount})
          </TabsTrigger>
          <TabsTrigger value="global" data-testid="tab-global" className="gap-1">
            <Globe className="h-4 w-4" />
            Catalogo Globale ({globalCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca prodotto o SKU..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-inventory"
          />
        </div>
        <Select value={centerFilter} onValueChange={setCenterFilter}>
          <SelectTrigger className="w-[250px]" data-testid="select-repair-center">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tutti i centri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i centri</SelectItem>
            {repairCenters.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {center.name} - {center.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {repairCenters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nessun centro riparazione associato al tuo account.
            </p>
          </CardContent>
        </Card>
      ) : filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || centerFilter !== "all" || ownershipFilter !== "all"
                ? "Nessun prodotto trovato con i filtri applicati."
                : "Nessun prodotto in magazzino."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {ownershipFilter === "all" && `Inventario (${filteredInventory.length} prodotti)`}
              {ownershipFilter === "own" && `I Miei Prodotti (${filteredInventory.length})`}
              {ownershipFilter === "global" && `Catalogo Globale (${filteredInventory.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Quantità</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-medium">
                      {item.product?.name || "N/D"}
                    </TableCell>
                    <TableCell>
                      {getOwnershipBadge(item.product?.isOwn)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.product?.sku || "N/D"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.repairCenter?.name || "N/D"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.product?.category || "N/D"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.product ? formatCurrency(item.product.unitPrice) : "N/D"}
                    </TableCell>
                    <TableCell>{getLowStockBadge(item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {ownershipFilter === "all" && "Totale Prodotti"}
              {ownershipFilter === "own" && "I Miei Prodotti"}
              {ownershipFilter === "global" && "Catalogo Globale"}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scorte Basse</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {filteredInventory.filter((i) => i.quantity > 0 && i.quantity < 5).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esauriti</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredInventory.filter((i) => i.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
