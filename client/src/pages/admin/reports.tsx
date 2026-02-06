import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Download, CalendarIcon, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import type { RepairCenter } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminReports() {
  usePageTitle("Report");
  const [repairDateRange, setRepairDateRange] = useState<DateRange | undefined>();
  const [repairStatus, setRepairStatus] = useState<string>("all");
  const [repairCenterId, setRepairCenterId] = useState<string>("all");
  const [isExportingRepairs, setIsExportingRepairs] = useState(false);

  const [inventoryDateRange, setInventoryDateRange] = useState<DateRange | undefined>();
  const [isExportingInventory, setIsExportingInventory] = useState(false);

  const { toast } = useToast();

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const handleExportRepairs = async () => {
    try {
      setIsExportingRepairs(true);
      const params = new URLSearchParams();
      params.append("format", "excel");
      
      if (repairStatus !== "all") params.append("status", repairStatus);
      if (repairCenterId !== "all") params.append("repairCenterId", repairCenterId);
      if (repairDateRange?.from) params.append("startDate", format(repairDateRange.from, "yyyy-MM-dd"));
      if (repairDateRange?.to) params.append("endDate", format(repairDateRange.to, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/reports/repairs?${params.toString()}`, {
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
        description: "Il report riparazioni è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
        variant: "destructive",
      });
    } finally {
      setIsExportingRepairs(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      setIsExportingInventory(true);
      const params = new URLSearchParams();
      params.append("format", "excel");
      
      if (inventoryDateRange?.from) params.append("startDate", format(inventoryDateRange.from, "yyyy-MM-dd"));
      if (inventoryDateRange?.to) params.append("endDate", format(inventoryDateRange.to, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/reports/inventory?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export completato",
        description: "Il report inventario è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
        variant: "destructive",
      });
    } finally {
      setIsExportingInventory(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Report</h1>
              <p className="text-sm text-muted-foreground">
                Esporta dati in formato Excel per analisi dettagliate
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Repair Orders Report */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Report Riparazioni
                </CardTitle>
                <CardDescription className="mt-2">
                  Esporta tutti i dati delle riparazioni con filtri personalizzati
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stato</label>
              <Select value={repairStatus} onValueChange={setRepairStatus}>
                <SelectTrigger data-testid="select-repair-status">
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="in_progress">In Lavorazione</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="delivered">Consegnato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Centro Riparazione</label>
              <Select value={repairCenterId} onValueChange={setRepairCenterId}>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Tutti i centri" />
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-repair-date">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {repairDateRange?.from ? (
                      repairDateRange.to ? (
                        <>
                          {format(repairDateRange.from, "dd MMM", { locale: it })} -{" "}
                          {format(repairDateRange.to, "dd MMM yyyy", { locale: it })}
                        </>
                      ) : (
                        format(repairDateRange.from, "dd MMM yyyy", { locale: it })
                      )
                    ) : (
                      "Seleziona periodo"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={repairDateRange}
                    onSelect={setRepairDateRange}
                    numberOfMonths={2}
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={handleExportRepairs} 
              disabled={isExportingRepairs}
              className="w-full"
              data-testid="button-export-repairs"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingRepairs ? "Esportazione..." : "Esporta Riparazioni"}
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Report */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Report Inventario
                </CardTitle>
                <CardDescription className="mt-2">
                  Esporta tutti i movimenti di inventario con storico completo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-inventory-date">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {inventoryDateRange?.from ? (
                      inventoryDateRange.to ? (
                        <>
                          {format(inventoryDateRange.from, "dd MMM", { locale: it })} -{" "}
                          {format(inventoryDateRange.to, "dd MMM yyyy", { locale: it })}
                        </>
                      ) : (
                        format(inventoryDateRange.from, "dd MMM yyyy", { locale: it })
                      )
                    ) : (
                      "Seleziona periodo"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={inventoryDateRange}
                    onSelect={setInventoryDateRange}
                    numberOfMonths={2}
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="rounded-md bg-muted p-4 space-y-2">
              <h4 className="text-sm font-medium">Include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tutti i movimenti di magazzino</li>
                <li>• Entrate, uscite e rettifiche</li>
                <li>• Dettagli prodotto e centro riparazione</li>
                <li>• Quantità e note operative</li>
              </ul>
            </div>

            <Button 
              onClick={handleExportInventory} 
              disabled={isExportingInventory}
              className="w-full"
              data-testid="button-export-inventory"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingInventory ? "Esportazione..." : "Esporta Inventario"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• I file vengono generati in formato Excel (.xlsx) con intestazioni in italiano</p>
          <p>• Gli importi sono formattati in Euro (€) con separatore decimale</p>
          <p>• Le date seguono il formato italiano gg/mm/aaaa</p>
          <p>• I filtri applicati vengono inclusi automaticamente nell'export</p>
        </CardContent>
      </Card>
    </div>
  );
}
