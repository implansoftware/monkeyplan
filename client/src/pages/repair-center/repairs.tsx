import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wrench, Plus, LayoutGrid, TableIcon, Smartphone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { useLocation } from "wouter";
import { RepairsKanbanBoard } from "@/components/RepairsKanbanBoard";

type RepairOrder = {
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
};

interface PaginatedRepairsResponse {
  data: RepairOrder[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function RepairCenterRepairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
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
  }, [statusFilter, deviceTypeFilter]);

  // Fetch device types for filter dropdown
  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  // Paginated query for table view
  const { data: paginatedData, isLoading: isLoadingTable } = useQuery<PaginatedRepairsResponse>({
    queryKey: [
      "/api/repair-center/repairs/paginated",
      page,
      pageSize,
      statusFilter,
      deviceTypeFilter,
      debouncedSearch,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (deviceTypeFilter !== "all") params.append("deviceType", deviceTypeFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      const res = await fetch(`/api/repair-center/repairs/paginated?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    enabled: viewMode === "table",
  });

  // Full dataset query for kanban view
  const { data: kanbanRepairs = [], isLoading: isLoadingKanban } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-orders"],
    enabled: viewMode === "kanban",
  });

  // Apply client-side filtering for kanban
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
      return matchesSearch && matchesStatus && matchesDeviceType;
    });
  }, [kanbanRepairs, debouncedSearch, statusFilter, deviceTypeFilter]);

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
      case "ingressato": return <Badge variant="secondary" data-testid={`badge-status-ingressato`}>Ingressato</Badge>;
      case "in_diagnosi": return <Badge variant="outline" data-testid={`badge-status-in_diagnosi`}>In Diagnosi</Badge>;
      case "preventivo_emesso": return <Badge variant="outline" data-testid={`badge-status-preventivo_emesso`}>Preventivo Emesso</Badge>;
      case "preventivo_accettato": return <Badge data-testid={`badge-status-preventivo_accettato`}>Preventivo Accettato</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive" data-testid={`badge-status-preventivo_rifiutato`}>Preventivo Rifiutato</Badge>;
      case "attesa_ricambi": return <Badge variant="outline" data-testid={`badge-status-attesa_ricambi`}>Attesa Ricambi</Badge>;
      case "in_riparazione": return <Badge data-testid={`badge-status-in_riparazione`}>In Riparazione</Badge>;
      case "in_test": return <Badge data-testid={`badge-status-in_test`}>In Test</Badge>;
      case "pronto_ritiro": return <Badge data-testid={`badge-status-pronto_ritiro`}>Pronto Ritiro</Badge>;
      case "consegnato": return <Badge variant="outline" data-testid={`badge-status-consegnato`}>Consegnato</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`badge-status-cancelled`}>Annullato</Badge>;
      // Legacy stati
      case "pending": return <Badge variant="secondary" data-testid={`badge-status-pending`}>In attesa</Badge>;
      case "in_progress": return <Badge data-testid={`badge-status-in_progress`}>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`badge-status-completed`}>Completata</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`badge-status-delivered`}>Consegnata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/A";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Lavorazioni Assegnate</h1>
          <p className="text-muted-foreground">
            Gestisci tutte le riparazioni assegnate al tuo centro
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
          <div className="flex justify-between items-center gap-4">
            <CardTitle>Filtri</CardTitle>
            <Button
              onClick={() => setWizardOpen(true)}
              data-testid="button-new-acceptance"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo ingresso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero ordine o modello..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="ingressato">Ingressato</SelectItem>
                <SelectItem value="in_diagnosi">In Diagnosi</SelectItem>
                <SelectItem value="preventivo_emesso">Preventivo Emesso</SelectItem>
                <SelectItem value="preventivo_accettato">Preventivo Accettato</SelectItem>
                <SelectItem value="attesa_ricambi">Attesa Ricambi</SelectItem>
                <SelectItem value="in_riparazione">In Riparazione</SelectItem>
                <SelectItem value="in_test">In Test</SelectItem>
                <SelectItem value="pronto_ritiro">Pronto Ritiro</SelectItem>
                <SelectItem value="consegnato">Consegnato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-device-type">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Riparazioni ({viewMode === "table" ? total : repairs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "kanban" ? (
            <RepairsKanbanBoard
              repairs={repairs as any}
              isLoading={isLoading}
              onCardClick={(repairId) => {
                setLocation(`/repair-center/repairs/${repairId}`);
              }}
            />
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna riparazione trovata
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero Ordine</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => (
                  <TableRow
                    key={repair.id}
                    data-testid={`row-repair-${repair.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => {
                      setLocation(`/repair-center/repairs/${repair.id}`);
                    }}
                  >
                    <TableCell className="font-medium" data-testid={`text-order-${repair.orderNumber}`}>
                      {repair.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{repair.deviceType}</div>
                        <div className="text-sm text-muted-foreground">{repair.deviceModel}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(repair.status)}</TableCell>
                    <TableCell>{format(new Date(repair.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={repair.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: repair.id, status })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[150px]" data-testid={`select-status-${repair.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">In attesa</SelectItem>
                          <SelectItem value="in_progress">In lavorazione</SelectItem>
                          <SelectItem value="completed">Completata</SelectItem>
                          <SelectItem value="delivered">Consegnata</SelectItem>
                          <SelectItem value="cancelled">Annullata</SelectItem>
                        </SelectContent>
                      </Select>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page === 1}
                data-testid="button-first-page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                data-testid="button-last-page"
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
          queryClient.invalidateQueries({ queryKey: ["/api/repair-center/stats"] });
        }}
      />
    </div>
  );
}
