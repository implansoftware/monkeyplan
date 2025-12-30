import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairOrder, RepairCenter } from "@shared/schema";
import { Building, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wrench, CalendarIcon, Plus, Eye, Clock, AlertTriangle, AlertCircle, LayoutGrid, TableIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { useLocation } from "wouter";
import { RepairsKanbanBoard } from "@/components/RepairsKanbanBoard";

interface RepairOrderWithSLA extends RepairOrder {
  slaSeverity: "in_time" | "late" | "urgent" | null;
  slaMinutesInState: number;
  slaPhase: string | null;
  slaEnteredAt: string | null;
  customerName: string | null;
  repairCenterName: string | null;
  quoteTotalAmount: number | null;
}

interface PaginatedRepairsResponse {
  data: RepairOrderWithSLA[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ResellerRepairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [repairCenterFilter, setRepairCenterFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, slaFilter, repairCenterFilter, dateRange]);

  // Fetch repair centers for filter
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  // Paginated query for table view
  const { data: paginatedData, isLoading: isLoadingTable } = useQuery<PaginatedRepairsResponse>({
    queryKey: [
      "/api/reseller/repairs/paginated",
      page,
      pageSize,
      statusFilter,
      slaFilter,
      repairCenterFilter,
      debouncedSearch,
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (slaFilter !== "all") params.append("slaSeverity", slaFilter);
      if (repairCenterFilter !== "all") params.append("repairCenterId", repairCenterFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      
      const res = await fetch(`/api/reseller/repairs/paginated?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    enabled: viewMode === "table",
  });

  // Full dataset query for kanban view
  const { data: kanbanRepairs = [], isLoading: isLoadingKanban } = useQuery<RepairOrderWithSLA[]>({
    queryKey: ["/api/repair-orders", { slaSeverity: slaFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (slaFilter !== "all") params.append("slaSeverity", slaFilter);
      const res = await fetch(`/api/repair-orders?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    enabled: viewMode === "kanban",
  });

  // Apply client-side filtering for kanban
  const filteredKanbanRepairs = kanbanRepairs.filter((repair) => {
    const searchLower = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      repair.orderNumber.toLowerCase().includes(searchLower) ||
      repair.deviceModel.toLowerCase().includes(searchLower) ||
      (repair.customerName && repair.customerName.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    const matchesRepairCenter = repairCenterFilter === "all" || repair.repairCenterId === repairCenterFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const repairDate = new Date(repair.createdAt);
      matchesDate = repairDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && repairDate <= dateRange.to;
      }
    }
    
    return matchesSearch && matchesStatus && matchesRepairCenter && matchesDate;
  });

  const repairs = viewMode === "table" ? (paginatedData?.data || []) : filteredKanbanRepairs;
  const isLoading = viewMode === "table" ? isLoadingTable : isLoadingKanban;
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary">Ingressato</Badge>;
      case "in_diagnosi": return <Badge variant="outline">In Diagnosi</Badge>;
      case "preventivo_emesso": return <Badge variant="outline">Preventivo Emesso</Badge>;
      case "preventivo_accettato": return <Badge>Preventivo Accettato</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive">Preventivo Rifiutato</Badge>;
      case "attesa_ricambi": return <Badge variant="outline">Attesa Ricambi</Badge>;
      case "in_riparazione": return <Badge>In Riparazione</Badge>;
      case "in_test": return <Badge>In Test</Badge>;
      case "pronto_ritiro": return <Badge>Pronto Ritiro</Badge>;
      case "consegnato": return <Badge variant="outline">Consegnato</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullato</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/reseller/export/repairs?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `riparazioni_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export completato",
        description: "Il file Excel è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Le Mie Lavorazioni</h1>
          <p className="text-muted-foreground">
            Monitora le riparazioni dei tuoi clienti
          </p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")}>
          <TabsList>
            <TabsTrigger value="table" className="gap-2" data-testid="toggle-table-view">
              <TableIcon className="h-4 w-4" />
              Tavolo
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2" data-testid="toggle-kanban-view">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca lavorazione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-repairs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="ingressato">Ingressato</SelectItem>
                <SelectItem value="in_diagnosi">In Diagnosi</SelectItem>
                <SelectItem value="preventivo_emesso">Preventivo Emesso</SelectItem>
                <SelectItem value="preventivo_accettato">Preventivo Accettato</SelectItem>
                <SelectItem value="preventivo_rifiutato">Preventivo Rifiutato</SelectItem>
                <SelectItem value="attesa_ricambi">Attesa Ricambi</SelectItem>
                <SelectItem value="in_riparazione">In Riparazione</SelectItem>
                <SelectItem value="in_test">In Test</SelectItem>
                <SelectItem value="pronto_ritiro">Pronto Ritiro</SelectItem>
                <SelectItem value="consegnato">Consegnato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-sla">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Tutti SLA
                  </span>
                </SelectItem>
                <SelectItem value="in_time">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-green-500" />
                    In Tempo
                  </span>
                </SelectItem>
                <SelectItem value="late">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    In Ritardo
                  </span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Urgente
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
              <SelectTrigger className="w-full sm:w-52" data-testid="select-filter-repair-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    Tutti i centri
                  </span>
                </SelectItem>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    <span className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      {center.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-64" data-testid="button-date-range">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd MMM yyyy", { locale: it })} - ${format(dateRange.to, "dd MMM yyyy", { locale: it })}`
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: it })
                    )
                  ) : (
                    "Seleziona periodo"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={it}
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={() => setWizardOpen(true)}
              data-testid="button-new-acceptance"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo ingresso
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || repairs.length === 0}
              variant="outline"
              data-testid="button-export-repairs"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Esportazione..." : "Esporta Excel"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "kanban" ? (
            <RepairsKanbanBoard
              repairs={filteredKanbanRepairs}
              isLoading={isLoading}
              onCardClick={(repairId) => {
                setLocation(`/reseller/repairs/${repairId}`);
              }}
            />
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna lavorazione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => (
                  <TableRow
                    key={repair.id}
                    data-testid={`row-repair-${repair.id}`}
                    className="hover-elevate cursor-pointer"
                    onClick={() => {
                      setLocation(`/reseller/repairs/${repair.id}`);
                    }}
                  >
                    <TableCell className="font-mono font-medium">
                      {repair.orderNumber}
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <span className="truncate block" title={repair.customerName || "—"}>
                        {repair.customerName || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <span className="truncate block" title={repair.repairCenterName || "—"}>
                        {repair.repairCenterName || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium capitalize">{repair.deviceType}</div>
                        <div className="text-sm text-muted-foreground">{repair.deviceModel}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(repair.status)}
                    </TableCell>
                    <TableCell>
                      {repair.slaSeverity && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={
                                repair.slaSeverity === "urgent" 
                                  ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 gap-1 animate-pulse"
                                  : repair.slaSeverity === "late"
                                  ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 gap-1"
                                  : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 gap-1"
                              }
                              data-testid={`badge-sla-${repair.slaSeverity}`}
                            >
                              {repair.slaSeverity === "urgent" ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : repair.slaSeverity === "late" ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {repair.slaPhase}: {
                                repair.slaMinutesInState >= 1440
                                  ? `${Math.floor(repair.slaMinutesInState / 1440)} giorni ${Math.floor((repair.slaMinutesInState % 1440) / 60)}h`
                                  : repair.slaMinutesInState >= 60
                                  ? `${Math.floor(repair.slaMinutesInState / 60)}h ${repair.slaMinutesInState % 60}m`
                                  : `${repair.slaMinutesInState} min`
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(repair.createdAt), { addSuffix: true, locale: it })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/reseller/repairs/${repair.id}`);
                              }}
                              data-testid={`button-view-repair-${repair.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Dettagli</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {viewMode === "table" && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Pagina {page} di {totalPages} ({total} risultati)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page === 1}
                data-testid="button-pagination-first"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-pagination-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">{page}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-pagination-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                data-testid="button-pagination-last"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <RepairIntakeWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/reseller/repairs/paginated"] });
        }}
      />
    </div>
  );
}
