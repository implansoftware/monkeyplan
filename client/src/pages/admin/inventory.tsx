import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryStock, RepairCenter } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type InventoryWithDetails = InventoryStock & {
  product?: { name: string; sku: string; category: string };
  repairCenter?: { name: string; city: string };
};

export default function AdminInventory() {
  const [centerFilter, setCenterFilter] = useState<string>("all");

  const { data: centers = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const { data: inventory = [], isLoading } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/admin/inventory"],
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesCenter = centerFilter === "all" || item.repairCenterId === centerFilter;
    return matchesCenter;
  });

  const getLowStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Esaurito</Badge>;
    if (quantity < 5) return <Badge variant="secondary">Scorte basse</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Magazzino</h1>
        <p className="text-muted-foreground">
          Monitora le scorte di tutti i centri di riparazione
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prodotti Totali</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scorte Basse</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter((item) => item.quantity < 5 && item.quantity > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esauriti</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter((item) => item.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-64" data-testid="select-filter-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i centri</SelectItem>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun articolo in magazzino</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Quantità</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-medium">
                      {item.product?.name || "N/D"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.product?.sku || "N/D"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{item.repairCenter?.name || "N/D"}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.repairCenter?.city || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{item.quantity}</TableCell>
                    <TableCell>{getLowStockBadge(item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
