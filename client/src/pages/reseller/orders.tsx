import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairOrder } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { RepairOrderDetailDrawer } from "@/components/RepairOrderDetailDrawer";

export default function ResellerOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline">In attesa pezzi</Badge>;
      case "completed": return <Badge>Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">I Miei Ordini</h1>
        <p className="text-muted-foreground">
          Visualizza e monitora tutte le riparazioni
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca ordine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="in_progress">In lavorazione</SelectItem>
                <SelectItem value="completed">Completate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun ordine trovato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-order-${order.id}`}
                  onClick={() => {
                    setSelectedRepairId(order.id);
                    setDrawerOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-medium">
                            #{order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <h3 className="font-medium mb-1 capitalize">
                          {order.deviceType} - {order.deviceModel}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {order.issueDescription}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: it })}
                        </div>
                        {order.estimatedCost && (
                          <div className="text-sm font-semibold">
                            €{(order.estimatedCost / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RepairOrderDetailDrawer
        repairOrderId={selectedRepairId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
