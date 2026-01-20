import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Search,
  Eye,
  PlayCircle,
  StopCircle,
  Building2,
  Receipt,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PosSession {
  id: string;
  repairCenterId: string;
  repairCenterName: string;
  registerName: string | null;
  operatorName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  totalSales: number;
  totalTransactions: number;
  openingCash: number | null;
  closingCash: number | null;
}

interface RepairCenter {
  id: string;
  name: string;
}

interface SessionDetail {
  session: PosSession;
  transactions: Array<{
    id: string;
    transactionNumber: string;
    status: string;
    paymentMethod: string;
    total: number;
    createdAt: string;
  }>;
}

interface TransactionItem {
  id: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isService?: boolean;
}

interface TransactionDetail {
  transaction: {
    id: string;
    transactionNumber: string;
    status: string;
    paymentMethod: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    createdAt: string;
    notes?: string;
  };
  items: TransactionItem[];
  operator?: { id: string; fullName: string };
  customer?: { id: string; fullName: string; email: string; phone: string | null };
  repairCenterName?: string;
}

export default function ResellerPosSessions() {
  const [repairCenterFilter, setRepairCenterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: sessions, isLoading } = useQuery<PosSession[]>({
    queryKey: ["/api/reseller/pos/sessions", repairCenterFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      const res = await fetch(`/api/reseller/pos/sessions?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const { data: sessionDetail, isLoading: sessionDetailLoading } = useQuery<SessionDetail>({
    queryKey: ["/api/reseller/pos/session", selectedSessionId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/pos/session/${selectedSessionId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch session detail");
      return res.json();
    },
    enabled: !!selectedSessionId,
  });

  const { data: transactionDetail, isLoading: transactionDetailLoading } = useQuery<TransactionDetail>({
    queryKey: ["/api/reseller/pos/transaction", selectedTransactionId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/pos/transaction/${selectedTransactionId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transaction detail");
      return res.json();
    },
    enabled: !!selectedTransactionId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <Badge className="bg-green-600"><PlayCircle className="w-3 h-3 mr-1" />Aperta</Badge>;
    }
    return <Badge variant="secondary"><StopCircle className="w-3 h-3 mr-1" />Chiusa</Badge>;
  };

  const filteredSessions = sessions?.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.repairCenterName.toLowerCase().includes(q) ||
           s.operatorName.toLowerCase().includes(q) ||
           (s.registerName?.toLowerCase().includes(q));
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
      
      const response = await fetch(`/api/reseller/pos/sessions/export?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Errore nell'esportazione");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessioni_rete_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Export completato", description: `File ${format.toUpperCase()} scaricato con successo` });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile esportare le sessioni", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Storico Sessioni Centri
          </h1>
          <p className="text-muted-foreground">Visualizza tutte le sessioni cassa dei tuoi centri riparazione</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting} data-testid="button-export-sessions">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Cerca per centro, operatore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-search-sessions"
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
              <SelectTrigger className="w-[150px]" data-testid="select-status">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="open">Aperte</SelectItem>
                <SelectItem value="closed">Chiuse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sessioni ({filteredSessions?.length || 0})
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
                  <TableHead>Centro</TableHead>
                  <TableHead>Cassa</TableHead>
                  <TableHead>Operatore</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Chiusura</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Transazioni</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nessuna sessione trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions?.map(s => (
                    <TableRow key={s.id} data-testid={`row-session-${s.id}`}>
                      <TableCell className="font-medium">{s.repairCenterName}</TableCell>
                      <TableCell>{s.registerName || "-"}</TableCell>
                      <TableCell>{s.operatorName}</TableCell>
                      <TableCell>{format(new Date(s.openedAt), "dd/MM/yyyy HH:mm", { locale: it })}</TableCell>
                      <TableCell>
                        {s.closedAt ? format(new Date(s.closedAt), "dd/MM/yyyy HH:mm", { locale: it }) : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-right">{s.totalTransactions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(s.totalSales)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedSessionId(s.id)}
                          data-testid={`button-view-${s.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSessionId} onOpenChange={(open) => !open && setSelectedSessionId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dettaglio Sessione
            </DialogTitle>
          </DialogHeader>
          {sessionDetailLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : sessionDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Centro</p>
                  <p className="font-medium">{sessionDetail.session.repairCenterName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cassa</p>
                  <p className="font-medium">{sessionDetail.session.registerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operatore</p>
                  <p className="font-medium">{sessionDetail.session.operatorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stato</p>
                  {getStatusBadge(sessionDetail.session.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Apertura</p>
                  <p className="font-medium">{format(new Date(sessionDetail.session.openedAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chiusura</p>
                  <p className="font-medium">{sessionDetail.session.closedAt ? format(new Date(sessionDetail.session.closedAt), "dd/MM/yyyy HH:mm", { locale: it }) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transazioni</p>
                  <p className="font-medium">{sessionDetail.session.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale Vendite</p>
                  <p className="font-medium text-lg">{formatCurrency(sessionDetail.session.totalSales)}</p>
                </div>
              </div>

              {sessionDetail.transactions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Transazioni della sessione
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero</TableHead>
                        <TableHead>Ora</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionDetail.transactions.map(tx => (
                        <TableRow 
                          key={tx.id} 
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedTransactionId(tx.id)}
                          data-testid={`row-transaction-${tx.id}`}
                        >
                          <TableCell className="font-mono">{tx.transactionNumber}</TableCell>
                          <TableCell>{format(new Date(tx.createdAt), "HH:mm", { locale: it })}</TableCell>
                          <TableCell>{tx.paymentMethod}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(tx.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTransactionId} onOpenChange={(open) => !open && setSelectedTransactionId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Dettaglio Transazione
            </DialogTitle>
          </DialogHeader>
          
          {transactionDetailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : transactionDetail ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numero</p>
                  <p className="font-mono font-medium">{transactionDetail.transaction.transactionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Centro</p>
                  <p className="font-medium">{transactionDetail.repairCenterName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operatore</p>
                  <p className="font-medium">{transactionDetail.operator?.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{transactionDetail.customer?.fullName || "Vendita anonima"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Ora</p>
                  <p className="font-medium">{format(new Date(transactionDetail.transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metodo Pagamento</p>
                  <Badge variant="outline">{transactionDetail.transaction.paymentMethod}</Badge>
                </div>
              </div>

              {transactionDetail.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Articoli</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prodotto</TableHead>
                        <TableHead className="text-center">Qtà</TableHead>
                        <TableHead className="text-right">Prezzo Unit.</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionDetail.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              {item.productSku && <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>}
                              {item.isService && <Badge variant="secondary" className="text-xs mt-1">Servizio</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotale</span>
                  <span>{formatCurrency(transactionDetail.transaction.subtotal)}</span>
                </div>
                {transactionDetail.transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sconto</span>
                    <span>-{formatCurrency(transactionDetail.transaction.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatCurrency(transactionDetail.transaction.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Totale</span>
                  <span>{formatCurrency(transactionDetail.transaction.total)}</span>
                </div>
              </div>

              {transactionDetail.transaction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="text-sm">{transactionDetail.transaction.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
