import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type RepairOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  resellerId: string | null;
  repairCenterId: string | null;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function RepairCenterRepairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: repairs = [], isLoading } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-center/repairs"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/repairs/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/stats"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch = repair.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" data-testid={`badge-status-pending`}>In attesa</Badge>;
      case "in_progress": return <Badge data-testid={`badge-status-in_progress`}>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`badge-status-completed`}>Completata</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`badge-status-delivered`}>Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`badge-status-cancelled`}>Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/A";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Lavorazioni Assegnate</h1>
        <p className="text-muted-foreground">
          Gestisci tutte le riparazioni assegnate al tuo centro
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero ordine o modello..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="in_progress">In lavorazione</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="delivered">Consegnata</SelectItem>
                <SelectItem value="cancelled">Annullata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Riparazioni ({filteredRepairs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna riparazione trovata
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero Ordine</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Costo Stimato</TableHead>
                  <TableHead>Costo Finale</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepairs.map((repair) => (
                  <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
                    <TableCell className="font-medium" data-testid={`text-order-${repair.orderNumber}`}>
                      {repair.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{repair.deviceType}</div>
                        <div className="text-sm text-muted-foreground">{repair.deviceModel}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {repair.issueDescription}
                    </TableCell>
                    <TableCell>{getStatusBadge(repair.status)}</TableCell>
                    <TableCell>{formatCurrency(repair.estimatedCost)}</TableCell>
                    <TableCell>{formatCurrency(repair.finalCost)}</TableCell>
                    <TableCell>{format(new Date(repair.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Select
                        value={repair.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: repair.id, status })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[150px]" data-testid={`select-status-${repair.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">In attesa</SelectItem>
                          <SelectItem value="in_progress">In lavorazione</SelectItem>
                          <SelectItem value="completed">Completata</SelectItem>
                          <SelectItem value="delivered">Consegnata</SelectItem>
                          <SelectItem value="cancelled">Annullata</SelectItem>
                        </SelectContent>
                      </Select>
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
