import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairOrder, RepairCenter } from "@shared/schema";
import { Building, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, PackageCheck, Play, Smartphone } from "lucide-react";
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
import { Search, Wrench, CalendarIcon, Plus, Eye, Clock, AlertTriangle, AlertCircle, LayoutGrid, TableIcon, RotateCcw, ChevronDown, ChevronUp, CornerDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { RepairReturnWizard } from "@/components/RepairReturnWizard";
import { ReturnSubRows } from "@/components/ReturnSubRows";
import { useLocation } from "wouter";
import { RepairsKanbanBoard } from "@/components/RepairsKanbanBoard";
import { ActionGuard } from "@/components/permission-guard";
import { useTranslation } from "react-i18next";

interface RepairOrderWithSLA extends RepairOrder {
  slaSeverity: "in_time" | "late" | "urgent" | null;
  slaMinutesInState: number;
  slaPhase: string | null;
  slaEnteredAt: string | null;
  customerName: string | null;
  repairCenterName: string | null;
  quoteTotalAmount: number | null;
  returnCount?: number;
}

interface PaginatedRepairsResponse {
  data: RepairOrderWithSLA[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ResellerRepairs() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [repairCenterFilter, setRepairCenterFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [returnWizardOpen, setReturnWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [expandedReturns, setExpandedReturns] = useState<Set<string>>(new Set());
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
  }, [statusFilter, slaFilter, repairCenterFilter, deviceTypeFilter, dateRange]);

  // Fetch repair centers for filter
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  // Fetch device types for filter dropdown
  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
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
      if (deviceTypeFilter !== "all") params.append("deviceType", deviceTypeFilter);
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
      (repair.brand && repair.brand.toLowerCase().includes(searchLower)) ||
      (repair.imei && repair.imei.toLowerCase().includes(searchLower)) ||
      (repair.customerName && repair.customerName.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    const matchesRepairCenter = repairCenterFilter === "all" || repair.repairCenterId === repairCenterFilter;
    const matchesDeviceType = deviceTypeFilter === "all" || repair.deviceType === deviceTypeFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const repairDate = new Date(repair.createdAt);
      matchesDate = repairDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && repairDate <= dateRange.to;
      }
    }
    
    return matchesSearch && matchesStatus && matchesRepairCenter && matchesDeviceType && matchesDate;
  });

  const repairs = viewMode === "table" ? (paginatedData?.data || []) : filteredKanbanRepairs;
  const isLoading = viewMode === "table" ? isLoadingTable : isLoadingKanban;
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary">{t("repairs.status.received")}</Badge>;
      case "in_diagnosi": return <Badge variant="outline">In Diagnosi</Badge>;
      case "preventivo_emesso": return <Badge variant="outline">Preventivo Emesso</Badge>;
      case "preventivo_accettato": return <Badge>Preventivo Accettato</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive">{t("repairs.status.quoteRejected")}</Badge>;
      case "attesa_ricambi": return <Badge variant="outline">Attesa Ricambi</Badge>;
      case "in_riparazione": return <Badge>In Riparazione</Badge>;
      case "in_test": return <Badge>In Test</Badge>;
      case "pronto_ritiro": return <Badge>Pronto Ritiro</Badge>;
      case "consegnato": return <Badge variant="outline">{t("repairs.status.delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("repairs.status.cancelled")}</Badge>;
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
        title: t("reports.exportCompleted"),
        description: t("repairs.excelDownloaded"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("reports.exportFailed"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate stats
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
    <div className="space-y-6" data-testid="page-reseller-repairs">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("sidebar.items.jobs")}</h1>
              <p className="text-sm text-white/80">
                {t("repairs.monitorDesc")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-wrap">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")}>
              <TabsList>
                <TabsTrigger value="table" className="gap-2" data-testid="toggle-table-view">
                  <TableIcon className="h-4 w-4" />
                  {t("common.table")}
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-2" data-testid="toggle-kanban-view">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ActionGuard module="repairs" action="create">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-[#ff1212] text-[#ffffff]"
                  onClick={() => setReturnWizardOpen(true)}
                  data-testid="button-new-return"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("repairs.return.title", "Nuovo Rientro")}
                </Button>
                <Button
                  onClick={() => setWizardOpen(true)}
                  className="shadow-lg shadow-primary/25"
                  data-testid="button-new-acceptance-hero"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("repairs.newIntake", "Nuovo Ingresso")}
                </Button>
              </div>
            </ActionGuard>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden rounded-2xl hover-elevate">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Lavorazioni</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{totalRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {repairs.length > 0 ? `${t("common.page")} ${page}/${totalPages}` : t("common.noFilter")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("repairs.inProgress")}</p>
                <p className="text-3xl font-bold tabular-nums text-teal-600 dark:text-teal-400">{inProgressRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Diagnosi, riparazione, test
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Play className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Pronte Ritiro</p>
                <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{readyForPickup}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  In attesa del cliente
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <PackageCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Consegnate Oggi</p>
                <p className="text-3xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{completedToday}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Riparazioni completate
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
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
                placeholder={t("repairs.searchWork")}
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
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="ingressato">Ingressato</SelectItem>
                <SelectItem value="in_diagnosi">In Diagnosi</SelectItem>
                <SelectItem value="preventivo_emesso">Preventivo Emesso</SelectItem>
                <SelectItem value="preventivo_accettato">Preventivo Accettato</SelectItem>
                <SelectItem value="preventivo_rifiutato">Preventivo Rifiutato</SelectItem>
                <SelectItem value="attesa_ricambi">Attesa Ricambi</SelectItem>
                <SelectItem value="in_riparazione">In Riparazione</SelectItem>
                <SelectItem value="in_test">In Test</SelectItem>
                <SelectItem value="pronto_ritiro">Pronto Ritiro</SelectItem>
                <SelectItem value="consegnato">{t("repairs.status.delivered")}</SelectItem>
                <SelectItem value="cancelled">{t("repairs.status.cancelled")}</SelectItem>
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
                    <Clock className="h-3 w-3 text-green-500" />{t("settings.onTime")}</span>
                </SelectItem>
                <SelectItem value="late">
                  <span className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />{t("settings.delayed")}</span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="flex flex-wrap items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />{t("settings.urgent")}</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
              <SelectTrigger className="w-full sm:w-52" data-testid="select-filter-repair-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex flex-wrap items-center gap-2">
                    <Building className="h-3 w-3" />{t("common.allCenters")}</span>
                </SelectItem>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    <span className="flex flex-wrap items-center gap-2">
                      <Building className="h-3 w-3" />
                      {center.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-device-type">
                <Smartphone className="h-4 w-4 shrink-0" />
                <SelectValue placeholder={t("repairs.deviceType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allDevices")}</SelectItem>
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
                    t("common.selectPeriod")
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
              onClick={handleExport}
              disabled={isExporting || repairs.length === 0}
              variant="outline"
              data-testid="button-export-repairs"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t("pages.exporting") : t("reports.exportExcel")}
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
              <p>{t("admin.resellerDetail.noRepairsFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.order")}</TableHead>
                  <TableHead>{t("common.customer")}</TableHead>
                  <TableHead>{t("admin.common.center")}</TableHead>
                  <TableHead>{t("repairs.device")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("settings.tabs.sla")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => (
                  <Fragment key={repair.id}>
                    <TableRow
                      data-testid={`row-repair-${repair.id}`}
                      className="hover-elevate cursor-pointer"
                      onClick={() => {
                        setLocation(`/reseller/repairs/${repair.id}`);
                      }}
                    >
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-1">
                          {(repair.returnCount || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedReturns(prev => {
                                  const next = new Set(prev);
                                  if (next.has(repair.id)) next.delete(repair.id);
                                  else next.add(repair.id);
                                  return next;
                                });
                              }}
                              data-testid={`button-toggle-returns-${repair.id}`}
                            >
                              {expandedReturns.has(repair.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          <span>{repair.orderNumber}</span>
                          {(repair.returnCount || 0) > 0 && (
                            <Badge variant="outline" className="text-xs ml-1 gap-1">
                              <RotateCcw className="h-3 w-3" />
                              {repair.returnCount}
                            </Badge>
                          )}
                        </div>
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
                              <p>{t("common.details")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedReturns.has(repair.id) && (
                      <ReturnSubRows
                        parentId={repair.id}
                        rolePrefix="/reseller"
                        getStatusBadge={getStatusBadge}
                      />
                    )}
                  </Fragment>
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
          queryClient.invalidateQueries({ queryKey: ["/api/reseller/repairs/paginated"] });
        }}
      />

      <RepairReturnWizard
        open={returnWizardOpen}
        onOpenChange={setReturnWizardOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/reseller/repairs/paginated"] });
        }}
      />
    </div>
  );
}
