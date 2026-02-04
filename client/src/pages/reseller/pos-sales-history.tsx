import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Receipt, 
  Search,
  Eye,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  History
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
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Completata</Badge>;
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

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams({ format });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      const response = await fetch(`/api/reseller/pos/transactions/export?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Errore nell'esportazione");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendite_rete_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Export completato", description: `File ${format.toUpperCase()} scaricato con successo` });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile esportare le vendite", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Storico Vendite Centri
              </h1>
              <p className="text-sm text-white/80">
                Visualizza tutte le transazioni POS dei tuoi centri riparazione
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white" disabled={isExporting} data-testid="button-export-transactions">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Esportazione..." : "Esporta"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} data-testid="menu-export-csv">
                <FileText className="h-4 w-4 mr-2" />
                Esporta CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')} data-testid="menu-export-xlsx">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Esporta Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-t-2xl">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-repair-center">
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
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status">
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

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-t-2xl">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            Transazioni ({filteredTransactions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
                        <div className="flex flex-wrap items-center gap-1">
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
