import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wrench, Pencil, Euro, Clock, Search, Tag, Building2, X, Check
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ServiceItem, ServiceItemPrice, RepairCenter } from "@shared/schema";

const SERVICE_CATEGORIES = [
  { value: "display", label: "Display" },
  { value: "batteria", label: "Batteria" },
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "diagnostica", label: "Diagnostica" },
  { value: "altro", label: "Altro" },
];

const getCategoryLabel = (category: string) => {
  return SERVICE_CATEGORIES.find(c => c.value === category)?.label || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    display: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    batteria: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    software: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    hardware: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    diagnostica: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    altro: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return colors[category] || colors.altro;
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

interface ServiceCatalogItem extends ServiceItem {
  resellerPrice: ServiceItemPrice | null;
  centerPrices: { [centerId: string]: ServiceItemPrice };
}

interface ServiceCatalogResponse {
  items: ServiceCatalogItem[];
  repairCenters: RepairCenter[];
}

export default function ResellerServiceCatalog() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedCenterId, setSelectedCenterId] = useState<string>("reseller");
  
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [priceEuros, setPriceEuros] = useState<string>("");
  const [laborMinutes, setLaborMinutes] = useState<string>("");
  
  const [priceToDelete, setPriceToDelete] = useState<{ item: ServiceCatalogItem; priceId: string } | null>(null);

  const { data: catalogData, isLoading } = useQuery<ServiceCatalogResponse>({
    queryKey: ["/api/reseller/service-catalog"],
  });

  const savePriceMutation = useMutation({
    mutationFn: async (data: { 
      serviceItemId: string; 
      priceCents: number; 
      laborMinutes?: number;
      repairCenterId?: string;
    }) => {
      return await apiRequest("POST", "/api/reseller/service-item-prices", data);
    },
    onSuccess: () => {
      toast({ title: "Prezzo Salvato", description: "Il prezzo personalizzato è stato salvato" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-catalog"] });
      setIsPriceDialogOpen(false);
      resetPriceForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deletePriceMutation = useMutation({
    mutationFn: async (priceId: string) => {
      return await apiRequest("DELETE", `/api/reseller/service-item-prices/${priceId}`);
    },
    onSuccess: () => {
      toast({ title: "Prezzo Eliminato", description: "Il prezzo personalizzato è stato eliminato" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-catalog"] });
      setIsDeleteDialogOpen(false);
      setPriceToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetPriceForm = () => {
    setEditingItem(null);
    setPriceEuros("");
    setLaborMinutes("");
  };

  const openPriceDialog = (item: ServiceCatalogItem) => {
    setEditingItem(item);
    
    let existingPrice: ServiceItemPrice | null = null;
    if (selectedCenterId === "reseller") {
      existingPrice = item.resellerPrice;
    } else {
      existingPrice = item.centerPrices[selectedCenterId] || null;
    }
    
    if (existingPrice) {
      setPriceEuros((existingPrice.priceCents / 100).toFixed(2));
      setLaborMinutes(existingPrice.laborMinutes?.toString() || "");
    } else {
      setPriceEuros((item.defaultPriceCents / 100).toFixed(2));
      setLaborMinutes(item.defaultLaborMinutes?.toString() || "");
    }
    
    setIsPriceDialogOpen(true);
  };

  const handleSavePrice = () => {
    if (!editingItem || !priceEuros) return;
    
    const priceCents = Math.round(parseFloat(priceEuros) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      toast({ title: "Errore", description: "Prezzo non valido", variant: "destructive" });
      return;
    }
    
    const data: any = {
      serviceItemId: editingItem.id,
      priceCents,
    };
    
    if (laborMinutes) {
      data.laborMinutes = parseInt(laborMinutes);
    }
    
    if (selectedCenterId !== "reseller") {
      data.repairCenterId = selectedCenterId;
    }
    
    savePriceMutation.mutate(data);
  };

  const openDeleteDialog = (item: ServiceCatalogItem) => {
    let priceId: string | null = null;
    if (selectedCenterId === "reseller") {
      priceId = item.resellerPrice?.id || null;
    } else {
      priceId = item.centerPrices[selectedCenterId]?.id || null;
    }
    
    if (priceId) {
      setPriceToDelete({ item, priceId });
      setIsDeleteDialogOpen(true);
    }
  };

  const filteredItems = catalogData?.items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const getEffectivePrice = (item: ServiceCatalogItem) => {
    if (selectedCenterId === "reseller") {
      return item.resellerPrice?.priceCents || item.defaultPriceCents;
    }
    const centerPrice = item.centerPrices[selectedCenterId];
    if (centerPrice) return centerPrice.priceCents;
    if (item.resellerPrice) return item.resellerPrice.priceCents;
    return item.defaultPriceCents;
  };

  const hasCustomPrice = (item: ServiceCatalogItem) => {
    if (selectedCenterId === "reseller") {
      return !!item.resellerPrice;
    }
    return !!item.centerPrices[selectedCenterId];
  };

  const getPriceSource = (item: ServiceCatalogItem): "custom" | "reseller" | "base" => {
    if (selectedCenterId === "reseller") {
      return item.resellerPrice ? "custom" : "base";
    }
    if (item.centerPrices[selectedCenterId]) return "custom";
    if (item.resellerPrice) return "reseller";
    return "base";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Wrench className="h-6 w-6" />
            Catalogo Interventi
          </h1>
          <p className="text-muted-foreground">
            Gestisci i prezzi personalizzati per te e i tuoi centri di riparazione
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="text-sm font-medium">Visualizza prezzi per:</Label>
              <Select
                value={selectedCenterId}
                onValueChange={setSelectedCenterId}
              >
                <SelectTrigger className="w-64" data-testid="select-price-context">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reseller">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>Prezzi Rivenditore (miei)</span>
                    </div>
                  </SelectItem>
                  {catalogData?.repairCenters.map(center => (
                    <SelectItem key={center.id} value={center.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{center.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca intervento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40" data-testid="select-category-filter">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {SERVICE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun intervento trovato</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Intervento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Prezzo Base</TableHead>
                    <TableHead className="text-right">Prezzo Effettivo</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => {
                    const effectivePrice = getEffectivePrice(item);
                    const priceSource = getPriceSource(item);
                    const isCustom = hasCustomPrice(item);
                    
                    return (
                      <TableRow key={item.id} data-testid={`row-service-${item.id}`}>
                        <TableCell className="font-mono text-sm">
                          {item.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getCategoryColor(item.category)}>
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(item.defaultPriceCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={isCustom ? "font-semibold text-primary" : ""}>
                              {formatCurrency(effectivePrice)}
                            </span>
                            {priceSource === "custom" && (
                              <Badge variant="default" className="text-xs">
                                Personalizzato
                              </Badge>
                            )}
                            {priceSource === "reseller" && selectedCenterId !== "reseller" && (
                              <Badge variant="secondary" className="text-xs">
                                Da Rivenditore
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isCustom ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-xs">Base</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openPriceDialog(item)}
                              data-testid={`button-edit-price-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isCustom && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteDialog(item)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-price-${item.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Prezzo</DialogTitle>
            <DialogDescription>
              {editingItem && (
                <>
                  Imposta il prezzo personalizzato per <strong>{editingItem.name}</strong>
                  {selectedCenterId === "reseller" ? (
                    <span> (Rivenditore)</span>
                  ) : (
                    <span> ({catalogData?.repairCenters.find(c => c.id === selectedCenterId)?.name})</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prezzo (EUR)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEuros}
                  onChange={(e) => setPriceEuros(e.target.value)}
                  className="pl-9"
                  placeholder="0.00"
                  data-testid="input-price"
                />
              </div>
              {editingItem && (
                <p className="text-xs text-muted-foreground">
                  Prezzo base: {formatCurrency(editingItem.defaultPriceCents)}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="laborMinutes">Tempo Manodopera (minuti, opzionale)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="laborMinutes"
                  type="number"
                  min="0"
                  value={laborMinutes}
                  onChange={(e) => setLaborMinutes(e.target.value)}
                  className="pl-9"
                  placeholder="Lascia vuoto per usare il default"
                  data-testid="input-labor-minutes"
                />
              </div>
              {editingItem && (
                <p className="text-xs text-muted-foreground">
                  Tempo base: {editingItem.defaultLaborMinutes} minuti
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPriceDialogOpen(false)}
              data-testid="button-cancel-price"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSavePrice}
              disabled={savePriceMutation.isPending}
              data-testid="button-save-price"
            >
              {savePriceMutation.isPending ? "Salvataggio..." : "Salva Prezzo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Prezzo Personalizzato</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il prezzo personalizzato per "{priceToDelete?.item.name}"?
              Verrà ripristinato il prezzo base o quello del rivenditore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => priceToDelete && deletePriceMutation.mutate(priceToDelete.priceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePriceMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
