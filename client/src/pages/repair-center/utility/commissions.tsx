import { useTranslation } from "react-i18next";
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
  Search, Coins, ArrowLeft, CheckCircle2, Clock, XCircle, Calendar, Euro
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CommissionStatus = "pending" | "accrued" | "invoiced" | "paid" | "cancelled";


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


export default function RepairCenterUtilityCommissions() {
  const { t } = useTranslation();
  const statusLabels: Record<CommissionStatus, string> = {
    pending: t("utility.commissionStatus.inAttesa"),
    accrued: t("utility.commissionStatus.maturata"),
    invoiced: t("utility.commissionStatus.fatturata"),
    paid: t("utility.commissionStatus.pagata"),
    cancelled: t("utility.commissionStatus.annullata"),
  };
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };
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
    { value: 1, label: t("common.months.january") },
    { value: 2, label: t("common.months.february") },
    { value: 3, label: t("common.months.march") },
    { value: 4, label: t("common.months.april") },
    { value: 5, label: t("common.months.may") },
    { value: 6, label: t("common.months.june") },
    { value: 7, label: t("common.months.july") },
    { value: 8, label: t("common.months.august") },
    { value: 9, label: t("common.months.september") },
    { value: 10, label: t("common.months.october") },
    { value: 11, label: t("common.months.november") },
    { value: 12, label: t("common.months.december") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/repair-center/utility">
              <Button variant="outline" size="icon" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Euro className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("utility.commissioni")}</h1>
              <p className="text-emerald-100">Visualizza le tue commissioni</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("common.pending")}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t("utility.totaleAnno")}</CardTitle>
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
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("utility.cercaPerPratica")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-commissions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allMasc")}</SelectItem>
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
              <p className="text-muted-foreground">{t("utility.nessunaCommissioneTrovata")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("utility.practice")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.period")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("utility.paymentDate")}</TableHead>
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
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap items-center gap-1">
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
                      <TableCell className="hidden md:table-cell">
                        {commission.paidAt 
                          ? format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: it })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
