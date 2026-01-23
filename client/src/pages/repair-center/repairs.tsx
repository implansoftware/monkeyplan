import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Wrench, Plus, LayoutGrid, TableIcon, Smartphone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarIcon, Clock, AlertTriangle, AlertCircle, Eye, Play, PackageCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { useLocation } from "wouter";
import { RepairsKanbanBoard } from "@/components/RepairsKanbanBoard";

interface RepairOrderWithSLA {
  id: string;
  orderNumber: string;
  customerId: string;
  resellerId: string | null;
  repairCenterId: string | null;
  deviceType: string;
  deviceModel: string;
  brand: string | null;
  imei: string | null;
  issueDescription: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string | null;
  slaSeverity?: "in_time" | "late" | "urgent" | null;
  slaMinutesInState?: number;
  slaPhase?: string | null;
  slaEnteredAt?: string | null;
  quoteTotalAmount?: number | null;
}

interface PaginatedRepairsResponse {
  data: RepairOrderWithSLA[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function RepairCenterRepairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, slaFilter, deviceTypeFilter, dateRange]);

  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  const { data: paginatedData, isLoading: isLoadingTable } = useQuery<PaginatedRepairsResponse>({
    queryKey: [
      "/api/repair-center/repairs/paginated",
      page,
      pageSize,
      statusFilter,
      slaFilter,
      deviceTypeFilter,
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
      if (deviceTypeFilter !== "all") params.append("deviceType", deviceTypeFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      
      const res = await fetch(`/api/repair-center/repairs/paginated?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    enabled: viewMode === "table",
  });

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

  const filteredKanbanRepairs = useMemo(() => {
    return kanbanRepairs.filter((repair) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch || 
        repair.orderNumber.toLowerCase().includes(searchLower) ||
        repair.deviceModel.toLowerCase().includes(searchLower) ||
        (repair.brand && repair.brand.toLowerCase().includes(searchLower)) ||
        (repair.imei && repair.imei.toLowerCase().includes(searchLower)) ||
        (repair.customerName && repair.customerName.toLowerCase().includes(searchLower));
      const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
      const matchesDeviceType = deviceTypeFilter === "all" || repair.deviceType === deviceTypeFilter;
      
      let matchesDate = true;
      if (dateRange?.from) {
        const repairDate = new Date(repair.createdAt);
        matchesDate = repairDate >= dateRange.from;
        if (dateRange.to) {
          matchesDate = matchesDate && repairDate <= dateRange.to;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDeviceType && matchesDate;
    });
  }, [kanbanRepairs, debouncedSearch, statusFilter, deviceTypeFilter, dateRange]);

  const repairs = viewMode === "table" ? (paginatedData?.data || []) : filteredKanbanRepairs;
  const isLoading = viewMode === "table" ? isLoadingTable : isLoadingKanban;
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-orders/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/stats"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

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
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline">Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalRepairs = total || repairs.length;
  const inProgressRepairs = repairs.filter(r => ['in_diagnosi', 'in_riparazione', 'in_test'].includes(r.status)).length;
  const readyForPickup = repairs.filter(r => r.status === 'pronto_ritiro').length;
  const completedToday = repairs.filter(r => {
    if (r.status !== 'consegnato') return false;
    const today = new Date();
    const repairDate = new Date(r.updatedAt);
    return repairDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6" data-testid="page-repair-center-repairs">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Riparazioni</h1>
              <p className="text-emerald-100">Gestisci tutte le riparazioni assegnate al tuo centro</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")}>
              <TabsList className="bg-white/20 backdrop-blur-sm border-white/30">
                <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-white/30 text-white" data-testid="toggle-table-view">
                  <TableIcon className="h-4 w-4" />
                  Tabella
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-white/30 text-white" data-testid="toggle-kanban-view">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={() => setWizardOpen(true)}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg"
              data-testid="button-new-acceptance-hero"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Ingresso
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Lavorazioni</p>
                <p className="text-3xl font-bold tabular-nums">{totalRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {repairs.length > 0 ? `Pagina ${page}/${totalPages}` : 'Nessun filtro'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">In Lavorazione</p>
                <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{inProgressRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Diagnosi, riparazione, test
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Play className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Pronte Ritiro</p>
                <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{readyForPickup}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  In attesa del cliente
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <PackageCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Consegnate Oggi</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{completedToday}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Riparazioni completate
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-device-type">
                <Smartphone className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Tipo dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i dispositivi</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
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
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "kanban" ? (
            <RepairsKanbanBoard
              repairs={filteredKanbanRepairs as any}
              isLoading={isLoading}
              onCardClick={(repairId) => {
                setLocation(`/repair-center/repairs/${repairId}`);
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
                      setLocation(`/repair-center/repairs/${repair.id}`);
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
                                (repair.slaMinutesInState || 0) >= 1440
                                  ? `${Math.floor((repair.slaMinutesInState || 0) / 1440)} giorni ${Math.floor(((repair.slaMinutesInState || 0) % 1440) / 60)}h`
                                  : (repair.slaMinutesInState || 0) >= 60
                                  ? `${Math.floor((repair.slaMinutesInState || 0) / 60)}h ${(repair.slaMinutesInState || 0) % 60}m`
                                  : `${repair.slaMinutesInState || 0} min`
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
                                setLocation(`/repair-center/repairs/${repair.id}`);
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
          queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs/paginated"] });
          queryClient.invalidateQueries({ queryKey: ["/api/repair-center/stats"] });
        }}
      />
    </div>
  );
}
