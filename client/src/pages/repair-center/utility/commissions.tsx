import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UtilityCommission, UtilityPractice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, Coins, ArrowLeft, CheckCircle2, Clock, XCircle, Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CommissionStatus = "pending" | "accrued" | "invoiced" | "paid" | "cancelled";

const statusLabels: Record<CommissionStatus, string> = {
  pending: "In Attesa",
  accrued: "Maturata",
  invoiced: "Fatturata",
  paid: "Pagata",
  cancelled: "Annullata",
};

const statusColors: Record<CommissionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  accrued: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  invoiced: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusIcons: Record<CommissionStatus, typeof Clock> = {
  pending: Clock,
  accrued: CheckCircle2,
  invoiced: CheckCircle2,
  paid: CheckCircle2,
  cancelled: XCircle,
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function RepairCenterUtilityCommissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  const { data: commissions = [], isLoading } = useQuery<UtilityCommission[]>({
    queryKey: ["/api/utility/commissions", yearFilter],
    queryFn: async () => {
      const res = await fetch(`/api/utility/commissions?periodYear=${yearFilter}`);
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
  });

  const { data: practices = [] } = useQuery<UtilityPractice[]>({
    queryKey: ["/api/utility/practices"],
  });

  const filteredCommissions = commissions.filter((commission) => {
    const practice = practices.find(p => p.id === commission.practiceId);
    const matchesSearch = practice?.practiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = filteredCommissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + c.amountCents, 0);
  const totalPaid = filteredCommissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "Gennaio" },
    { value: 2, label: "Febbraio" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Aprile" },
    { value: 5, label: "Maggio" },
    { value: 6, label: "Giugno" },
    { value: 7, label: "Luglio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Settembre" },
    { value: 10, label: "Ottobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Dicembre" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/repair-center/utility">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">I Miei Compensi</h1>
              <p className="text-sm text-muted-foreground">Visualizza le tue commissioni</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.filter(c => c.status === "pending").length} commissioni
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-paid">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.filter(c => c.status === "paid").length} commissioni
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Anno</CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredCommissions.reduce((sum, c) => sum + c.amountCents, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.length} commissioni nel {yearFilter}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per pratica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-commissions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={yearFilter.toString()} 
              onValueChange={(v) => setYearFilter(parseInt(v))}
            >
              <SelectTrigger className="w-24" data-testid="select-year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessuna commissione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pratica</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => {
                  const practice = practices.find(p => p.id === commission.practiceId);
                  const StatusIcon = statusIcons[commission.status];
                  return (
                    <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                      <TableCell className="font-medium">
                        {practice?.practiceNumber || commission.practiceId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {months.find(m => m.value === commission.periodMonth)?.label} {commission.periodYear}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(commission.amountCents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[commission.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[commission.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {commission.paidAt 
                          ? format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: it })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
