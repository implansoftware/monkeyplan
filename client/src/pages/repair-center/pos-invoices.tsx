import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShoppingCart, Eye, Receipt, FileText, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";

interface SaleTransaction {
  id: string;
  transactionNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  itemCount: number;
  createdAt: string;
  hasInvoice: boolean;
}

export default function SalesHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: transactions = [], isLoading } = useQuery<SaleTransaction[]>({
    queryKey: ["/api/repair-center/pos/sales-history"],
  });

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge>Completata</Badge>;
      case "refunded": return <Badge variant="destructive">Rimborsata</Badge>;
      case "partial_refund": return <Badge variant="secondary">Rimborso parziale</Badge>;
      case "voided": return <Badge variant="destructive">Annullata</Badge>;
      case "pending": return <Badge variant="secondary">In sospeso</Badge>;
      case "cancelled": return <Badge variant="outline">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
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

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const totalRevenue = transactions
    .filter(tx => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.total, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/5 via-teal-500/10 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/5 dark:to-cyan-900/10 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Storico Vendite</h1>
              <p className="text-sm text-muted-foreground">Tutte le transazioni effettuate dal POS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Totale incassato</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {transactions.length} vendite
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero transazione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-sales"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="refunded">Rimborsata</SelectItem>
                <SelectItem value="pending">In sospeso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nessuna vendita trovata</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Prova a modificare i filtri di ricerca" 
                  : "Le vendite effettuate dal POS appariranno qui"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Articoli</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-sale-${tx.id}`}>
                      <TableCell className="font-medium font-mono text-sm">{tx.transactionNumber}</TableCell>
                      <TableCell>
                        {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{tx.itemCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {getPaymentMethodLabel(tx.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{formatCurrency(tx.total)}</div>
                        {tx.discount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Sconto: {formatCurrency(tx.discount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(tx.status)}
                          {tx.hasInvoice && (
                            <FileText className="h-3.5 w-3.5 text-blue-500" title="Fattura emessa" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/repair-center/pos/transaction/${tx.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-${tx.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Dettagli
                          </Button>
                        </Link>
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
