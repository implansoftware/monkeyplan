import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Truck, CheckCircle, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RepairCenter } from "@shared/schema";

interface PartsOrderWithDetails {
  id: string;
  repairOrderId: string;
  repairOrderNumber: string;
  repairCenterName: string;
  repairCenterId: string;
  productId: string | null;
  productName: string;
  productSku: string;
  partName: string;
  partNumber: string | null;
  quantity: number;
  unitCost: number;
  status: string;
  orderedAt: string;
  expectedArrival: string | null;
  receivedAt: string | null;
  notes: string | null;
}

export default function AdminPartsOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: partsOrders = [], isLoading } = useQuery<PartsOrderWithDetails[]>({
    queryKey: ["/api/parts-orders"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/parts-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Stato aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ordered":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Ordinato</Badge>;
      case "in_transit":
        return <Badge variant="secondary"><Truck className="h-3 w-3 mr-1" />In Transito</Badge>;
      case "received":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Ricevuto</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const filteredOrders = partsOrders.filter((order) => {
    const matchesSearch = 
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.repairOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.repairCenterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.productSku?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesCenter = centerFilter === "all" || order.repairCenterId === centerFilter;
    
    return matchesSearch && matchesStatus && matchesCenter;
  });

  const stats = {
    total: partsOrders.length,
    ordered: partsOrders.filter(o => o.status === "ordered").length,
    inTransit: partsOrders.filter(o => o.status === "in_transit").length,
    received: partsOrders.filter(o => o.status === "received").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Ordini Ricambi
          </h1>
          <p className="text-muted-foreground">
            Gestisci tutti gli ordini ricambi dei centri di riparazione
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totale Ordini</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.ordered}</div>
            <div className="text-sm text-muted-foreground">In Attesa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
            <div className="text-sm text-muted-foreground">In Transito</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.received}</div>
            <div className="text-sm text-muted-foreground">Ricevuti</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per prodotto, ordine o centro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-parts-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="ordered">Ordinato</SelectItem>
                <SelectItem value="in_transit">In Transito</SelectItem>
                <SelectItem value="received">Ricevuto</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-center">
                <SelectValue placeholder="Tutti i centri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i centri</SelectItem>
                {repairCenters.map((center) => (
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
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun ordine ricambio trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Ordine Riparazione</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead className="text-center">Qtà</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Data Ordine</TableHead>
                  <TableHead>Arrivo Previsto</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-parts-order-${order.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.productName}</div>
                        {order.productSku && (
                          <div className="text-sm text-muted-foreground">
                            SKU: {order.productSku}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{order.repairOrderNumber}</span>
                    </TableCell>
                    <TableCell>{order.repairCenterName}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>{formatCurrency(order.unitCost * order.quantity)}</TableCell>
                    <TableCell>
                      {format(new Date(order.orderedAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {order.expectedArrival ? (
                        format(new Date(order.expectedArrival), "dd MMM yyyy", { locale: it })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {order.status === "ordered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "in_transit" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-transit-${order.id}`}
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            In Transito
                          </Button>
                        )}
                        {order.status === "in_transit" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "received" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-receive-${order.id}`}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ricevuto
                          </Button>
                        )}
                        {order.status === "received" && order.receivedAt && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(order.receivedAt), "dd/MM/yy", { locale: it })}
                          </span>
                        )}
                      </div>
                    </TableCell>
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
