import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RepairOrder, RepairCenter, PaginatedResult } from "@shared/schema";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wrench, Download, CalendarIcon, Plus, Stethoscope, Receipt, ClipboardCheck, Package, Play, TestTube, Truck, Eye, Clock, AlertTriangle, AlertCircle, LayoutGrid, TableIcon, Building, Store, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { useLocation } from "wouter";
import { RepairsKanbanBoard } from "@/components/RepairsKanbanBoard";
import { usePageTitle } from "@/hooks/use-page-title";

interface RepairOrderWithSLA extends RepairOrder {
  slaSeverity: "in_time" | "late" | "urgent" | null;
  slaMinutesInState: number;
  slaPhase: string | null;
  slaEnteredAt: string | null;
  customerName: string | null;
  repairCenterName: string | null;
  resellerName: string | null;
  quoteTotalAmount: number | null;
}

interface PaginatedRepairsResponse {
  data: RepairOrderWithSLA[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminRepairs() {
  usePageTitle("Riparazioni");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [repairCenterFilter, setRepairCenterFilter] = useState<string>("all");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, slaFilter, repairCenterFilter, resellerFilter, deviceTypeFilter, dateRange]);

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  // Fetch device types for filter dropdown
  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  // Fetch resellers for filter dropdown
  const { data: resellersData = [] } = useQuery<Array<{ id: string; username: string; fullName: string | null; ragioneSociale: string | null }>>({
    queryKey: ["/api/admin/resellers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/resellers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resellers");
      return res.json();
    },
  });

  const resellers = useMemo(() => {
    return resellersData.map(r => ({
      id: r.id,
      name: r.ragioneSociale || r.fullName || r.username,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [resellersData]);

  // Paginated query for table view
  const { data: paginatedData, isLoading: isLoadingTable } = useQuery<PaginatedRepairsResponse>({
    queryKey: [
      "/api/admin/repairs/paginated",
      page,
      pageSize,
      statusFilter,
      slaFilter,
      repairCenterFilter,
      resellerFilter,
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
      if (repairCenterFilter !== "all") params.append("repairCenterId", repairCenterFilter);
      if (resellerFilter !== "all") params.append("resellerId", resellerFilter);
      if (deviceTypeFilter !== "all") params.append("deviceType", deviceTypeFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      
      const res = await fetch(`/api/admin/repairs/paginated?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    enabled: viewMode === "table",
  });

  // Full dataset query for kanban view (uses original endpoint)
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

  // Apply client-side filtering for kanban (since it uses the original endpoint)
  const filteredKanbanRepairs = useMemo(() => {
    return kanbanRepairs.filter((repair) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch || 
        repair.orderNumber.toLowerCase().includes(searchLower) ||
        repair.deviceModel.toLowerCase().includes(searchLower) ||
        (repair.brand && repair.brand.toLowerCase().includes(searchLower)) ||
        (repair.imei && repair.imei.toLowerCase().includes(searchLower)) ||
        (repair.customerName && repair.customerName.toLowerCase().includes(searchLower)) ||
        (repair.resellerName && repair.resellerName.toLowerCase().includes(searchLower));
      const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
      const matchesRepairCenter = repairCenterFilter === "all" || repair.repairCenterId === repairCenterFilter;
      const matchesReseller = resellerFilter === "all" || repair.resellerId === resellerFilter;
      const matchesDeviceType = deviceTypeFilter === "all" || repair.deviceType === deviceTypeFilter;
      
      let matchesDate = true;
      if (dateRange?.from) {
        const repairDate = new Date(repair.createdAt);
        matchesDate = repairDate >= dateRange.from;
        if (dateRange.to) {
          matchesDate = matchesDate && repairDate <= dateRange.to;
        }
      }
      
      return matchesSearch && matchesStatus && matchesRepairCenter && matchesReseller && matchesDeviceType && matchesDate;
    });
  }, [kanbanRepairs, debouncedSearch, statusFilter, repairCenterFilter, resellerFilter, deviceTypeFilter, dateRange]);

  const repairs = viewMode === "table" ? (paginatedData?.data || []) : filteredKanbanRepairs;
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;
  const isLoading = viewMode === "table" ? isLoadingTable : isLoadingKanban;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/admin/export/repairs?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repairs_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-orders/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate both paginated and non-paginated queries
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repairs/paginated"] });
      toast({ title: "Stato aggiornato" });
    },
  });

  // Filtering is now done server-side, repairs are already filtered

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
      // Legacy stati
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline">In attesa pezzi</Badge>;
      case "completed": return <Badge>Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/D";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getWorkflowActions = (repair: RepairOrder) => {
    const actions: Array<{
      icon: typeof Stethoscope;
      label: string;
      available: boolean;
    }> = [];

    const status = repair.status;

    actions.push({
      icon: Stethoscope,
      label: "Diagnosi",
      available: status === "ingressato",
    });

    actions.push({
      icon: Receipt,
      label: "Preventivo",
      available: status === "in_diagnosi",
    });

    actions.push({
      icon: ClipboardCheck,
      label: "Gestisci Preventivo",
      available: status === "preventivo_emesso",
    });

    actions.push({
      icon: Package,
      label: "Ricambi",
      available: status === "preventivo_accettato" || status === "attesa_ricambi",
    });

    actions.push({
      icon: Play,
      label: "Riparazione",
      available: status === "in_riparazione",
    });

    actions.push({
      icon: TestTube,
      label: "Collaudo",
      available: status === "in_test",
    });

    actions.push({
      icon: Truck,
      label: "Consegna",
      available: status === "pronto_ritiro",
    });

    actions.push({
      icon: Eye,
      label: "Dettagli",
      available: true,
    });

    return actions;
  };

  const openRepairDetail = (repairId: string) => {
    setLocation(`/admin/repairs/${repairId}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Lavorazioni</h1>
              <p className="text-sm text-muted-foreground">Monitora tutte le riparazioni in corso</p>
            </div>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
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
                  <span className="flex flex-wrap items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Tutti SLA
                  </span>
                </SelectItem>
                <SelectItem value="in_time">
                  <span className="flex flex-wrap items-center gap-2">
                    <Clock className="h-3 w-3 text-green-500" />
                    In Tempo
                  </span>
                </SelectItem>
                <SelectItem value="late">
                  <span className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    In Ritardo
                  </span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="flex flex-wrap items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Urgente
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-repair-center">
                <Building className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Centro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i centri</SelectItem>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resellerFilter} onValueChange={setResellerFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-reseller">
                <Store className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Rivenditore" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i rivenditori</SelectItem>
                {resellers.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </SelectItem>
                ))}
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
              repairs={repairs}
              isLoading={isLoading}
              onCardClick={(repairId) => {
                openRepairDetail(repairId);
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
                  <TableHead>Rivenditore</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => {
                  const actions = getWorkflowActions(repair);
                  const availableActions = actions.filter(a => a.available);
                  
                  return (
                    <TableRow
                      key={repair.id}
                      data-testid={`row-repair-${repair.id}`}
                      className="hover-elevate"
                    >
                      <TableCell 
                        className="font-mono font-medium cursor-pointer"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        {repair.orderNumber}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer max-w-[150px]"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        <span className="truncate block" title={repair.customerName || "—"}>
                          {repair.customerName || "—"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer max-w-[150px]"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        <span className="truncate block" title={repair.resellerName || "—"}>
                          {repair.resellerName || "—"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer max-w-[150px]"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        <span className="truncate block" title={repair.repairCenterName || "—"}>
                          {repair.repairCenterName || "—"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        <div>
                          <div className="font-medium capitalize">{repair.deviceType}</div>
                          <div className="text-sm text-muted-foreground">{repair.deviceModel}</div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        {getStatusBadge(repair.status)}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
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
                      <TableCell 
                        className="text-sm text-muted-foreground cursor-pointer"
                        onClick={() => {
                          openRepairDetail(repair.id);
                        }}
                      >
                        {formatDistanceToNow(new Date(repair.createdAt), { addSuffix: true, locale: it })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {availableActions.map((actionItem, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRepairDetail(repair.id);
                                  }}
                                  data-testid={`button-action-${actionItem.label.toLowerCase().replace(/\s/g, '-')}-${repair.id}`}
                                >
                                  <actionItem.icon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{actionItem.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {viewMode === "table" && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Pagina {page} di {totalPages} ({total} risultati)
            </div>
            <div className="flex flex-wrap items-center gap-1">
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/repairs/paginated"] });
        }}
      />
    </div>
  );
}
