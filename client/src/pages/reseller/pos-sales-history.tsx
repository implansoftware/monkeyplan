import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Receipt, 
  Search,
  Eye,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";

interface PosTransaction {
  id: string;
  transactionNumber: string;
  repairCenterId: string;
  repairCenterName: string;
  registerName: string | null;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  createdAt: string;
}

interface RepairCenter {
  id: string;
  name: string;
}

export default function ResellerPosSalesHistory() {
  const [repairCenterFilter, setRepairCenterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: transactions, isLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/reseller/pos/transactions", repairCenterFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200" });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/reseller/pos/transactions?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Contanti",
      card: "Carta",
      pos_terminal: "POS",
      satispay: "Satispay",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === "cash") return <Banknote className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completata</Badge>;
      case "voided":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Annullata</Badge>;
      case "refunded":
        return <Badge variant="secondary"><RotateCcw className="w-3 h-3 mr-1" />Rimborsata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions?.filter(tx => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tx.transactionNumber.toLowerCase().includes(q) ||
           tx.repairCenterName.toLowerCase().includes(q) ||
           (tx.registerName?.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Storico Vendite Centri
          </h1>
          <p className="text-muted-foreground">Visualizza tutte le transazioni POS dei tuoi centri riparazione</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Cerca per numero, centro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-repair-center">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Centro Riparazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i centri</SelectItem>
                {repairCenters?.map(rc => (
                  <SelectItem key={rc.id} value={rc.id}>{rc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="completed">Completate</SelectItem>
                <SelectItem value="voided">Annullate</SelectItem>
                <SelectItem value="refunded">Rimborsate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transazioni ({filteredTransactions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Cassa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nessuna transazione trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions?.map(tx => (
                    <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                      <TableCell className="font-mono font-medium">{tx.transactionNumber}</TableCell>
                      <TableCell>{tx.repairCenterName}</TableCell>
                      <TableCell>{tx.registerName || "-"}</TableCell>
                      <TableCell>{format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(tx.paymentMethod)}
                          {getPaymentMethodLabel(tx.paymentMethod)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.total)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/reseller/pos/transaction/${tx.id}`}>
                          <Button size="sm" variant="ghost" data-testid={`button-view-${tx.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
