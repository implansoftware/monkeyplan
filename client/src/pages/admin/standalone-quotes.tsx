import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  X,
  Building,
  User,
  Euro,
  Calendar,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { usePageTitle } from "@/hooks/use-page-title";
import type { StandaloneQuote, StandaloneQuoteItem } from "@shared/schema";

type EnrichedQuote = StandaloneQuote & {
  items: StandaloneQuoteItem[];
  resellerName: string | null;
  repairCenterName: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export default function AdminStandaloneQuotes() {
  const { t } = useTranslation();
  usePageTitle(t("sidebar.items.quotes"));
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status !== "all") params.append("status", status);
  const qs = params.toString();

  const { data: quotes = [], isLoading } = useQuery<EnrichedQuote[]>({
    queryKey: ["/api/admin/standalone-quotes", { search, status }],
    queryFn: async () => {
      const url = qs ? `/api/admin/standalone-quotes?${qs}` : "/api/admin/standalone-quotes";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(t("common.loadingError"));
      return res.json();
    },
  });

  const statusLabels: Record<string, string> = {
    all: t("common.all"),
    draft: t("invoices.draft"),
    sent: t("standalone.sent"),
    accepted: t("standalone.accepted"),
    rejected: t("b2b.status.cancelled"),
    expired: t("standalone.expired"),
  };

  const getIssuer = (q: EnrichedQuote) => {
    if (q.repairCenterName) return { label: q.repairCenterName, type: "center" };
    if (q.resellerName) return { label: q.resellerName, type: "reseller" };
    return { label: "—", type: "unknown" };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("standalone.quotes")}</h1>
              <div className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    {quotes.length} {t("quotes.quotesFound")}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("common.search") + "…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-quotes"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44" data-testid="select-status-filter">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || status !== "all") && (
              <Button
                variant="ghost"
                size="default"
                onClick={() => { setSearch(""); setStatus("all"); }}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                {t("common.clearFilters")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm">{t("standalone.noQuotes")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.number")}</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("common.date")}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      {t("repairs.createdBy")}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {t("common.customer")}
                    </div>
                  </TableHead>
                  <TableHead>{t("common.device")}</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5" />
                      {t("common.amount")}
                    </div>
                  </TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const issuer = getIssuer(q);
                  return (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => navigate(`/admin/standalone-quotes/${q.id}`)}
                      data-testid={`row-quote-${q.id}`}
                    >
                      <TableCell className="font-mono font-medium text-sm">
                        {q.quoteNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(q.createdAt), "dd MMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[160px]">
                            {issuer.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {q.customerName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate max-w-[140px]">{q.customerName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {q.deviceDescription || "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatCurrency(q.totalAmountCents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[q.status] ?? ""}`}>
                          {statusLabels[q.status] ?? q.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/standalone-quotes/${q.id}`); }}
                          data-testid={`button-view-quote-${q.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
