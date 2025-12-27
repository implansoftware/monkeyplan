import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Smartphone, 
  X, 
  Check, 
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import type { DeviceBrand, DeviceModel } from "@shared/schema";

interface SmartphoneCompatibilityManagerProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CompatibilityItem {
  id: string;
  deviceBrandId: string;
  deviceModelId: string | null;
  brandName?: string;
  modelName?: string;
}

export function SmartphoneCompatibilityManager({
  productId,
  open,
  onOpenChange,
  onSuccess,
}: SmartphoneCompatibilityManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [pendingSelections, setPendingSelections] = useState<Map<string, { brandId: string; modelId: string | null }>>(new Map());

  const { data: brands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
    enabled: open,
  });

  const { data: deviceModels = [], isLoading: modelsLoading } = useQuery<(DeviceModel & { brandName?: string })[]>({
    queryKey: ["/api/device-models", { activeOnly: true }],
    enabled: open,
  });

  const { data: currentCompatibilities = [], isLoading: compatLoading } = useQuery<CompatibilityItem[]>({
    queryKey: ["/api/products", productId, "compatibilities"],
    enabled: open && !!productId,
  });

  useState(() => {
    if (currentCompatibilities.length > 0) {
      const existingIds = new Set<string>();
      const existingMap = new Map<string, { brandId: string; modelId: string | null }>();
      currentCompatibilities.forEach((c) => {
        const key = c.deviceModelId || `brand-${c.deviceBrandId}`;
        existingIds.add(key);
        existingMap.set(key, { brandId: c.deviceBrandId, modelId: c.deviceModelId });
      });
      setSelectedItems(existingIds);
      setPendingSelections(existingMap);
    }
  });

  useMemo(() => {
    if (open && currentCompatibilities.length > 0 && selectedItems.size === 0) {
      const existingIds = new Set<string>();
      const existingMap = new Map<string, { brandId: string; modelId: string | null }>();
      currentCompatibilities.forEach((c) => {
        const key = c.deviceModelId || `brand-${c.deviceBrandId}`;
        existingIds.add(key);
        existingMap.set(key, { brandId: c.deviceBrandId, modelId: c.deviceModelId });
      });
      setSelectedItems(existingIds);
      setPendingSelections(existingMap);
    }
  }, [open, currentCompatibilities]);

  const saveMutation = useMutation({
    mutationFn: async (compatibilities: { deviceBrandId: string; deviceModelId?: string | null }[]) => {
      return apiRequest("PUT", `/api/products/${productId}/compatibilities`, { compatibilities });
    },
    onSuccess: () => {
      toast({ title: "Compatibilità salvate", description: "Le compatibilità sono state aggiornate" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "compatibilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const enrichedModels = useMemo(() => {
    return deviceModels.map((model) => {
      const brand = brands.find((b) => b.id === model.brandId);
      return {
        ...model,
        brandName: brand?.name || model.brand || "Sconosciuto",
      };
    });
  }, [deviceModels, brands]);

  const filteredModels = useMemo(() => {
    let result = enrichedModels;
    
    if (selectedBrandFilter !== "all") {
      result = result.filter((m) => m.brandId === selectedBrandFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.modelName.toLowerCase().includes(query) ||
          m.brandName?.toLowerCase().includes(query)
      );
    }
    
    return result.slice(0, 50);
  }, [enrichedModels, selectedBrandFilter, searchQuery]);

  const toggleModel = (model: DeviceModel & { brandName?: string }) => {
    const newSelected = new Set(selectedItems);
    const newPending = new Map(pendingSelections);
    
    if (newSelected.has(model.id)) {
      newSelected.delete(model.id);
      newPending.delete(model.id);
    } else {
      newSelected.add(model.id);
      newPending.set(model.id, { brandId: model.brandId!, modelId: model.id });
    }
    
    setSelectedItems(newSelected);
    setPendingSelections(newPending);
  };

  const selectAllBrand = (brandId: string) => {
    const brandModels = enrichedModels.filter((m) => m.brandId === brandId);
    const newSelected = new Set(selectedItems);
    const newPending = new Map(pendingSelections);
    
    brandModels.forEach((model) => {
      newSelected.add(model.id);
      newPending.set(model.id, { brandId: model.brandId!, modelId: model.id });
    });
    
    setSelectedItems(newSelected);
    setPendingSelections(newPending);
  };

  const deselectAllBrand = (brandId: string) => {
    const brandModels = enrichedModels.filter((m) => m.brandId === brandId);
    const newSelected = new Set(selectedItems);
    const newPending = new Map(pendingSelections);
    
    brandModels.forEach((model) => {
      newSelected.delete(model.id);
      newPending.delete(model.id);
    });
    
    setSelectedItems(newSelected);
    setPendingSelections(newPending);
  };

  const clearAll = () => {
    setSelectedItems(new Set());
    setPendingSelections(new Map());
  };

  const handleSave = () => {
    const compatibilities = Array.from(pendingSelections.values()).map((item) => ({
      deviceBrandId: item.brandId,
      deviceModelId: item.modelId,
    }));
    saveMutation.mutate(compatibilities);
  };

  const selectedModelsDisplay = useMemo(() => {
    return Array.from(selectedItems)
      .map((id) => {
        const model = enrichedModels.find((m) => m.id === id);
        return model ? { id: model.id, name: `${model.brandName} ${model.modelName}` } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];
  }, [selectedItems, enrichedModels]);

  const removeSelected = (modelId: string) => {
    const newSelected = new Set(selectedItems);
    const newPending = new Map(pendingSelections);
    newSelected.delete(modelId);
    newPending.delete(modelId);
    setSelectedItems(newSelected);
    setPendingSelections(newPending);
  };

  const isLoading = modelsLoading || compatLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Gestione Compatibilità Dispositivi
          </DialogTitle>
          <DialogDescription>
            Seleziona i dispositivi compatibili con questo prodotto dal catalogo
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca modello..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-models"
                />
              </div>
              <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                <SelectTrigger className="w-48" data-testid="select-brand-filter">
                  <SelectValue placeholder="Filtra per marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le marche</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBrandFilter !== "all" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectAllBrand(selectedBrandFilter)}
                  data-testid="button-select-all-brand"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Seleziona tutti
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => deselectAllBrand(selectedBrandFilter)}
                  data-testid="button-deselect-all-brand"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deseleziona tutti
                </Button>
              </div>
            )}

            {selectedModelsDisplay.length > 0 && (
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Selezionati ({selectedModelsDisplay.length})</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      data-testid="button-clear-all"
                    >
                      Rimuovi tutti
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {selectedModelsDisplay.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => removeSelected(item.id)}
                        data-testid={`badge-selected-${item.id}`}
                      >
                        {item.name}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-1">
                {filteredModels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nessun modello trovato</p>
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate ${
                        selectedItems.has(model.id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => toggleModel(model)}
                      data-testid={`row-model-${model.id}`}
                    >
                      <Checkbox
                        checked={selectedItems.has(model.id)}
                        onCheckedChange={() => toggleModel(model)}
                        data-testid={`checkbox-model-${model.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{model.modelName}</p>
                        <p className="text-sm text-muted-foreground">{model.brandName}</p>
                      </div>
                      {selectedItems.has(model.id) && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-compatibilities"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Salva Compatibilità
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
