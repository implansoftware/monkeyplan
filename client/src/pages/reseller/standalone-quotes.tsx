import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
  Euro,
  Calendar,
  User,
  Smartphone,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { StandaloneQuote, StandaloneQuoteItem } from "@shared/schema";

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  accepted: "Accettato",
  rejected: "Rifiutato",
  expired: "Scaduto",
};

const statusClasses: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

type QuoteWithItems = StandaloneQuote & { items: StandaloneQuoteItem[] };

export default function StandaloneQuotesList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const quotesUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    const qs = params.toString();
    return `/api/standalone-quotes${qs ? `?${qs}` : ""}`;
  })();

  const { data: quotes, isLoading } = useQuery<QuoteWithItems[]>({
    queryKey: [quotesUrl],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/standalone-quotes/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standalone-quotes"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const hasActiveFilters = search || (statusFilter && statusFilter !== "all");

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Preventivi</h1>
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
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Preventivi</h1>
          {quotes && <Badge variant="secondary">{quotes.length}</Badge>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtri
          </Button>
          <Link href={`${basePath}/standalone-quotes/new`}>
            <Button data-testid="button-new-quote">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo Preventivo
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cerca per numero, cliente, dispositivo..."
                    className="pl-9"
                    data-testid="input-search-quotes"
                  />
                </div>
              </div>
              <div className="w-[160px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="sent">Inviato</SelectItem>
                    <SelectItem value="accepted">Accettato</SelectItem>
                    <SelectItem value="rejected">Rifiutato</SelectItem>
                    <SelectItem value="expired">Scaduto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4 mr-1" />
                  Cancella
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nessun preventivo</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {hasActiveFilters
                ? "Nessun preventivo trovato con i filtri selezionati."
                : "Crea il tuo primo preventivo standalone per iniziare."}
            </p>
            {!hasActiveFilters && (
              <Link href={`${basePath}/standalone-quotes/new`}>
                <Button data-testid="button-new-quote-empty">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuovo Preventivo
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {quotes.map((quote) => (
            <Card
              key={quote.id}
              className="hover-elevate cursor-pointer"
              onClick={() => navigate(`${basePath}/standalone-quotes/${quote.id}`)}
              data-testid={`quote-card-${quote.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" data-testid={`text-quote-number-${quote.id}`}>{quote.quoteNumber}</span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusClasses[quote.status] || ""}`}>
                        {statusLabels[quote.status] || quote.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {(quote.customerName || quote.customerEmail) && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {quote.customerName || quote.customerEmail}
                        </span>
                      )}
                      {quote.deviceDescription && (
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5" />
                          {quote.deviceDescription}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: it })}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">{quote.items.length} {quote.items.length === 1 ? "voce" : "voci"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-lg flex items-center gap-1 justify-end" data-testid={`text-quote-total-${quote.id}`}>
                        <Euro className="h-4 w-4" />
                        {formatCurrency(quote.totalAmountCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        IVA inclusa
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`button-actions-${quote.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/standalone-quotes/${quote.id}`); }}
                          data-testid={`action-view-${quote.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizza
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            fetch(`/api/standalone-quotes/${quote.id}/pdf`, { credentials: "include" })
                              .then(r => {
                                if (!r.ok) throw new Error("Errore generazione PDF");
                                return r.blob();
                              })
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${quote.quoteNumber}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast({ title: "PDF scaricato" });
                              })
                              .catch((err: any) => {
                                toast({ title: "Errore", description: err.message, variant: "destructive" });
                              });
                          }}
                          data-testid={`action-download-${quote.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Scarica PDF
                        </DropdownMenuItem>
                        {quote.status === "draft" && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: quote.id, status: "sent" }); }}
                            data-testid={`action-send-${quote.id}`}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Segna come Inviato
                          </DropdownMenuItem>
                        )}
                        {(quote.status === "draft" || quote.status === "sent") && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: quote.id, status: "accepted" }); }}
                            data-testid={`action-accept-${quote.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Segna come Accettato
                          </DropdownMenuItem>
                        )}
                        {(quote.status === "draft" || quote.status === "sent") && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: quote.id, status: "rejected" }); }}
                            data-testid={`action-reject-${quote.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Segna come Rifiutato
                          </DropdownMenuItem>
                        )}
                        {quote.status === "sent" && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: quote.id, status: "expired" }); }}
                            data-testid={`action-expire-${quote.id}`}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Segna come Scaduto
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
