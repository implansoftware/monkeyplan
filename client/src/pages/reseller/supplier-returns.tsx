import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Search, Building2, Truck, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type SupplierReturnWithDetails = {
  id: string;
  returnNumber: string;
  supplierId: string;
  repairCenterId: string;
  status: string;
  reason: string;
  reasonDetails: string | null;
  totalAmount: number;
  refundAmount: number | null;
  requestedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  refundedAt: string | null;
  rmaNumber: string | null;
  createdAt: string;
  supplier: { id: string; name: string; code: string } | null;
  repairCenter: { id: string; name: string; city: string } | null;
};

type RepairCenter = {
  id: string;
  name: string;
  city: string;
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  requested: "Richiesto",
  approved: "Approvato",
  shipped: "Spedito",
  received: "Ricevuto",
  refunded: "Rimborsato",
  rejected: "Rifiutato",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  requested: "outline",
  approved: "default",
  shipped: "default",
  received: "default",
  refunded: "default",
  rejected: "destructive",
};

const reasonLabels: Record<string, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo Errato",
  damaged: "Danneggiato",
  not_needed: "Non Necessario",
  other: "Altro",
};

export default function ResellerSupplierReturns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: returns = [], isLoading } = useQuery<SupplierReturnWithDetails[]>({
    queryKey: ["/api/reseller/supplier-returns"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch = 
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ret.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (ret.rmaNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCenter = centerFilter === "all" || ret.repairCenterId === centerFilter;
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
    return matchesSearch && matchesCenter && matchesStatus;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Resi Fornitori</h1>
              <p className="text-sm text-muted-foreground">Gestione resi ricambi</p>
            </div>
          </div>
          <Badge variant="secondary" data-testid="badge-returns-count">
            {returns.length} resi
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Resi a Fornitori
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca reso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-48" data-testid="select-center-filter">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Centro" />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun reso trovato</p>
              <p className="text-sm mt-1">I resi ai fornitori dei centri di riparazione associati appariranno qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero Reso</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Valore</TableHead>
                  <TableHead>RMA</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id} data-testid={`row-return-${ret.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-return-number-${ret.id}`}>
                      {ret.returnNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-return-supplier-${ret.id}`}>
                          {ret.supplier?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium" data-testid={`text-return-center-${ret.id}`}>
                            {ret.repairCenter?.name || "-"}
                          </div>
                          {ret.repairCenter?.city && (
                            <div className="text-xs text-muted-foreground">{ret.repairCenter.city}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-return-reason-${ret.id}`}>
                        {reasonLabels[ret.reason] || ret.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[ret.status] || "secondary"} data-testid={`badge-return-status-${ret.id}`}>
                        {statusLabels[ret.status] || ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-return-total-${ret.id}`}>
                      {formatCurrency(ret.totalAmount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-return-rma-${ret.id}`}>
                      {ret.rmaNumber || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-return-date-${ret.id}`}>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ret.createdAt), "dd MMM yyyy", { locale: it })}
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
