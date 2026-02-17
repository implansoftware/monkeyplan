import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Euro, Calendar, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RepairOrderDetailDrawer } from "@/components/RepairOrderDetailDrawer";

const quoteStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function QuotesList() {
  const { t } = useTranslation();
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const quoteStatusLabels: Record<string, string> = {
    draft: t("quotes.statusDraft"),
    sent: t("quotes.statusSent"),
    accepted: t("quotes.statusAccepted"),
    rejected: t("quotes.statusRejected"),
    expired: t("quotes.statusExpired"),
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "all") params.append("status", status);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    return params.toString();
  };

  const queryString = buildQueryParams();

  const { data: quotes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/quotes", { search, status, dateFrom, dateTo }],
    queryFn: async () => {
      const url = queryString ? `/api/quotes?${queryString}` : "/api/quotes";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(t("common.loadingError"));
      return res.json();
    },
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || (status && status !== "all") || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t("common.filters")}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {t("common.active")}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.search")}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("quotes.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-quote"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.status")}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder={t("common.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="draft">{t("quotes.statusDraft")}</SelectItem>
                    <SelectItem value="sent">{t("quotes.statusSent")}</SelectItem>
                    <SelectItem value="accepted">{t("quotes.statusAccepted")}</SelectItem>
                    <SelectItem value="rejected">{t("quotes.statusRejected")}</SelectItem>
                    <SelectItem value="expired">{t("quotes.statusExpired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.dateFrom")}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-9"
                    data-testid="input-date-from"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.dateTo")}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-9"
                    data-testid="input-date-to"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4 mr-2" />
                  {t("quotes.clearFilters")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <span>{t("quotes.activeFilters")}</span>
          {search && (
            <Badge variant="secondary">
              {t("common.search")}: "{search}"
            </Badge>
          )}
          {status && status !== "all" && (
            <Badge variant="secondary">
              {t("common.status")}: {quoteStatusLabels[status]}
            </Badge>
          )}
          {dateFrom && (
            <Badge variant="secondary">
              {t("common.from")}: {format(new Date(dateFrom), "dd/MM/yyyy")}
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary">
              {t("common.to")}: {format(new Date(dateTo), "dd/MM/yyyy")}
            </Badge>
          )}
        </div>
      )}

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {hasActiveFilters ? t("quotes.noQuotesWithFilters") : t("quotes.noQuotesFound")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm text-muted-foreground">
            {t("quotes.quotesFound", { count: quotes.length })}
          </div>
          {quotes.map((quote) => (
            <Card
              key={quote.id}
              className="hover-elevate cursor-pointer"
              onClick={() => {
                setSelectedRepairId(quote.repairOrderId);
                setDrawerOpen(true);
              }}
              data-testid={`card-quote-${quote.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {quote.quoteNumber}
                    </span>
                    <span>#{quote.orderNumber}</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={quoteStatusColors[quote.quoteStatus] || quoteStatusColors.draft}>
                      {quoteStatusLabels[quote.quoteStatus] || quote.quoteStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {quote.deviceType} - {quote.deviceModel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex flex-wrap items-center gap-1 font-semibold">
                        <Euro className="h-4 w-4" />
                        {quote.totalAmount ? (Number(quote.totalAmount) / 100).toFixed(2) : "0.00"}
                      </span>
                      {quote.laborCost && (
                        <span className="text-muted-foreground">
                          ({t("quotes.labor")}: €{(Number(quote.laborCost) / 100).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {quote.parts && Array.isArray(quote.parts) && quote.parts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quote.parts.slice(0, 3).map((part: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {part.name}: €{(Number(part.price || 0) / 100).toFixed(2)}
                        </Badge>
                      ))}
                      {quote.parts.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{quote.parts.length - 3} {t("quotes.parts")}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {t("quotes.created")}: {quote.createdAt && format(new Date(quote.createdAt), "dd MMM yyyy", { locale: it })}
                      </span>
                      {quote.validUntil && (
                        <span className="flex flex-wrap items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {t("quotes.validUntil")}: {format(new Date(quote.validUntil), "dd MMM yyyy", { locale: it })}
                        </span>
                      )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RepairOrderDetailDrawer
        repairOrderId={selectedRepairId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRepairId(null);
        }}
      />
    </div>
  );
}
