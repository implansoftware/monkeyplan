import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Clock, Package, Search, Filter, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RepairOrderDetailDrawer } from "@/components/RepairOrderDetailDrawer";

const severityLabels: Record<string, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function DiagnosisList() {
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (severity && severity !== "all") params.append("severity", severity);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    return params.toString();
  };

  const queryString = buildQueryParams();

  const { data: diagnostics, isLoading } = useQuery<any[]>({
    queryKey: ["/api/diagnostics", { search, severity, dateFrom, dateTo }],
    queryFn: async () => {
      const url = queryString ? `/api/diagnostics?${queryString}` : "/api/diagnostics";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const clearFilters = () => {
    setSearch("");
    setSeverity("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || (severity && severity !== "all") || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Diagnosi</h1>
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
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Diagnosi</h1>
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtri
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Attivi
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cerca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ordine, dispositivo, diagnosi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-diagnosis"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gravità</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger data-testid="select-severity">
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Critica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data da</label>
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
                <label className="text-sm font-medium">Data a</label>
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
                  Azzera filtri
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <span>Filtri attivi:</span>
          {search && (
            <Badge variant="secondary">
              Cerca: "{search}"
            </Badge>
          )}
          {severity && severity !== "all" && (
            <Badge variant="secondary">
              Gravità: {severityLabels[severity]}
            </Badge>
          )}
          {dateFrom && (
            <Badge variant="secondary">
              Dal: {format(new Date(dateFrom), "dd/MM/yyyy")}
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary">
              Al: {format(new Date(dateTo), "dd/MM/yyyy")}
            </Badge>
          )}
        </div>
      )}

      {!diagnostics || diagnostics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {hasActiveFilters ? "Nessuna diagnosi trovata con i filtri applicati" : "Nessuna diagnosi trovata"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm text-muted-foreground">
            {diagnostics.length} diagnosi trovate
          </div>
          {diagnostics.map((diagnosis) => (
            <Card
              key={diagnosis.id}
              className="hover-elevate cursor-pointer"
              onClick={() => {
                setSelectedRepairId(diagnosis.repairOrderId);
                setDrawerOpen(true);
              }}
              data-testid={`card-diagnosis-${diagnosis.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{diagnosis.orderNumber}
                    </span>
                    <span>{diagnosis.deviceType} - {diagnosis.deviceModel}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {diagnosis.severity && (
                      <Badge className={severityColors[diagnosis.severity]}>
                        {severityLabels[diagnosis.severity]}
                      </Badge>
                    )}
                    {diagnosis.requiresExternalParts && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Ricambi esterni
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {diagnosis.technicalDiagnosis}
                  </p>

                  {diagnosis.damagedComponents && diagnosis.damagedComponents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {diagnosis.damagedComponents.slice(0, 5).map((component: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                      {diagnosis.damagedComponents.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{diagnosis.damagedComponents.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {diagnosis.estimatedRepairTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {diagnosis.estimatedRepairTime} min
                        </span>
                      )}
                      <span>
                        {diagnosis.diagnosedAt && format(new Date(diagnosis.diagnosedAt), "dd MMM yyyy HH:mm", { locale: it })}
                      </span>
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
