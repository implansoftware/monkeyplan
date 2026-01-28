import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wrench, Pencil, Euro, Clock, Search, Tag, Building2, X, Check, Plus, Trash2,
  Globe, User, Users, Smartphone
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

const getOwnershipInfo = (item: ServiceItem, currentUserId: string | undefined, parentResellerId: string | undefined) => {
  if (!item.createdBy) {
    return { label: "Globale", icon: Globe, color: "text-blue-500" };
  }
  if (item.createdBy === currentUserId) {
    return { label: "Mio", icon: User, color: "text-green-500" };
  }
  if (parentResellerId && item.createdBy === parentResellerId) {
    return { label: "Reseller", icon: Users, color: "text-orange-500" };
  }
  return { label: "Altro", icon: Users, color: "text-muted-foreground" };
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
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [compatibilityFilter, setCompatibilityFilter] = useState<string>("all");
  const [selectedCenterId, setSelectedCenterId] = useState<string>("reseller");
  
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [isDeletePriceDialogOpen, setIsDeletePriceDialogOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [priceEuros, setPriceEuros] = useState<string>("");
  const [laborMinutes, setLaborMinutes] = useState<string>("");
  
  const [priceToDelete, setPriceToDelete] = useState<{ item: ServiceCatalogItem; priceId: string } | null>(null);

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServiceItem | null>(null);
  
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPriceEuros, setItemPriceEuros] = useState("");
  const [itemLaborMinutes, setItemLaborMinutes] = useState("60");
  const [itemDeviceTypeId, setItemDeviceTypeId] = useState<string>("");
  const [itemBrandId, setItemBrandId] = useState<string>("");
  const [itemModelId, setItemModelId] = useState<string>("");

  // Queries for device catalog
  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<Array<{ id: string; modelName: string; brandId: string; typeId: string }>>({
    queryKey: ["/api/device-models"],
  });

  // Filter brands and models based on selection
  // When type is selected, filter brands that have models for that type
  // When no type is selected, show all brands
  const filteredBrands = itemDeviceTypeId
    ? deviceBrands.filter(b => deviceModels.some(m => m.brandId === b.id && m.typeId === itemDeviceTypeId))
    : deviceBrands;

  // When brand is selected, filter models by brand (and type if selected)
  const filteredModels = itemBrandId
    ? deviceModels.filter(m => m.brandId === itemBrandId && (!itemDeviceTypeId || m.typeId === itemDeviceTypeId))
    : itemDeviceTypeId
      ? deviceModels.filter(m => m.typeId === itemDeviceTypeId)
      : [];

  const { data: catalogData, isLoading } = useQuery<ServiceCatalogResponse>({
    queryKey: ["/api/reseller/service-catalog"],
  });

  const { data: myItems, isLoading: isLoadingMyItems } = useQuery<ServiceItem[]>({
    queryKey: ["/api/reseller/service-items"],
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
      setIsDeletePriceDialogOpen(false);
      setPriceToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      category: string;
      deviceTypeId?: string;
      brandId?: string;
      modelId?: string;
      defaultPriceCents: number;
      defaultLaborMinutes: number;
    }) => {
      return await apiRequest("POST", "/api/reseller/service-items", data);
    },
    onSuccess: () => {
      toast({ title: "Intervento Creato", description: "Il nuovo intervento è stato aggiunto al catalogo" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-catalog"] });
      setIsItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceItem> }) => {
      return await apiRequest("PATCH", `/api/reseller/service-items/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Intervento Aggiornato", description: "Le modifiche sono state salvate" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-catalog"] });
      setIsItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reseller/service-items/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Intervento Eliminato", description: "L'intervento è stato rimosso dal catalogo" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-catalog"] });
      setIsDeleteItemDialogOpen(false);
      setItemToDelete(null);
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

  const resetItemForm = () => {
    setEditingServiceItem(null);
    setItemCode("");
    setItemName("");
    setItemDescription("");
    setItemCategory("");
    setItemPriceEuros("");
    setItemLaborMinutes("60");
    setItemDeviceTypeId("");
    setItemBrandId("");
    setItemModelId("");
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

  const openItemDialog = (item?: ServiceItem) => {
    if (item) {
      setEditingServiceItem(item);
      setItemCode(item.code);
      setItemName(item.name);
      setItemDescription(item.description || "");
      setItemCategory(item.category);
      setItemPriceEuros((item.defaultPriceCents / 100).toFixed(2));
      setItemLaborMinutes(item.defaultLaborMinutes?.toString() || "60");
      setItemDeviceTypeId((item as any).deviceTypeId || "");
      setItemBrandId((item as any).brandId || "");
      setItemModelId((item as any).modelId || "");
    } else {
      resetItemForm();
    }
    setIsItemDialogOpen(true);
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

  const handleSaveItem = () => {
    if (!itemCode || !itemName || !itemCategory || !itemPriceEuros) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }

    const priceCents = Math.round(parseFloat(itemPriceEuros) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      toast({ title: "Errore", description: "Prezzo non valido", variant: "destructive" });
      return;
    }

    const laborMins = parseInt(itemLaborMinutes) || 60;

    if (editingServiceItem) {
      updateItemMutation.mutate({
        id: editingServiceItem.id,
        data: {
          code: itemCode,
          name: itemName,
          description: itemDescription || null,
          category: itemCategory,
          deviceTypeId: itemDeviceTypeId || null,
          brandId: itemBrandId || null,
          modelId: itemModelId || null,
          defaultPriceCents: priceCents,
          defaultLaborMinutes: laborMins,
        },
      });
    } else {
      createItemMutation.mutate({
        code: itemCode,
        name: itemName,
        description: itemDescription || undefined,
        category: itemCategory,
        deviceTypeId: itemDeviceTypeId || undefined,
        brandId: itemBrandId || undefined,
        modelId: itemModelId || undefined,
        defaultPriceCents: priceCents,
        defaultLaborMinutes: laborMins,
      });
    }
  };

  const openDeletePriceDialog = (item: ServiceCatalogItem) => {
    let priceId: string | null = null;
    if (selectedCenterId === "reseller") {
      priceId = item.resellerPrice?.id || null;
    } else {
      priceId = item.centerPrices[selectedCenterId]?.id || null;
    }
    
    if (priceId) {
      setPriceToDelete({ item, priceId });
      setIsDeletePriceDialogOpen(true);
    }
  };

  const filteredItems = catalogData?.items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    const ownership = getOwnershipInfo(item, user?.id, (user as any)?.parentResellerId);
    const matchesOrigin = originFilter === "all" || 
      (originFilter === "global" && ownership.label === "Globale") ||
      (originFilter === "mine" && ownership.label === "Mio") ||
      (originFilter === "reseller" && ownership.label === "Reseller");
    
    const itemAny = item as any;
    const hasDeviceRestriction = itemAny.deviceTypeId || itemAny.brandId || itemAny.modelId;
    const matchesCompatibility = compatibilityFilter === "all" || 
      (compatibilityFilter === "universal" && !hasDeviceRestriction) ||
      (compatibilityFilter === "specific" && hasDeviceRestriction);
    
    return matchesSearch && matchesCategory && matchesOrigin && matchesCompatibility;
  }) || [];

  const filteredMyItems = myItems?.filter(item => {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Euro className="h-6 w-6 text-white" />
            </div>
            <div>
              <Skeleton className="h-7 w-48 bg-white/20" />
              <Skeleton className="h-4 w-64 mt-1 bg-white/20" />
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Euro className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">
                Listino Prezzi
              </h1>
              <p className="text-sm text-white/80">
                Gestisci i prezzi e crea le tue voci di listino personalizzate
              </p>
            </div>
          </div>
          <Button onClick={() => openItemDialog()} data-testid="button-create-item" variant="secondary" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Voce
          </Button>
        </div>
      </div>

      {/* Le Mie Voci Section */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Le Mie Voci
          </CardTitle>
          <CardDescription>
            {myItems?.length || 0} voci di listino create da te
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMyItems ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMyItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">{myItems?.length === 0 ? "Non hai ancora creato voci di listino personalizzate" : "Nessun risultato trovato"}</p>
              {myItems?.length === 0 && (
                <Button onClick={() => openItemDialog()} data-testid="button-create-first-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea la Prima Voce
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Intervento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMyItems.map(item => {
                    const itemAny = item as any;
                    const deviceType = deviceTypes.find(t => t.id === itemAny.deviceTypeId);
                    const brand = deviceBrands.find(b => b.id === itemAny.brandId);
                    const model = deviceModels.find(m => m.id === itemAny.modelId);
                    const hasDeviceRestriction = itemAny.deviceTypeId || itemAny.brandId || itemAny.modelId;
                    
                    return (
                      <TableRow key={item.id} data-testid={`row-my-item-${item.id}`}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getCategoryColor(item.category)}>
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasDeviceRestriction ? (
                            <div className="flex flex-wrap gap-1">
                              {deviceType && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      <Smartphone className="h-3 w-3 mr-1" />
                                      {deviceType.name}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Tipo dispositivo</TooltipContent>
                                </Tooltip>
                              )}
                              {brand && (
                                <Badge variant="outline" className="text-xs">
                                  {brand.name}
                                </Badge>
                              )}
                              {model && (
                                <Badge variant="outline" className="text-xs">
                                  {model.modelName}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Universale</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.defaultPriceCents)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.defaultLaborMinutes} min
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openItemDialog(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => { setItemToDelete(item); setIsDeleteItemDialogOpen(true); }}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Catalogo Completo Section */}
          <Card className="rounded-2xl">
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
                
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca intervento..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full sm:w-48"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-32" data-testid="select-category-filter">
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
                  <Select value={originFilter} onValueChange={setOriginFilter}>
                    <SelectTrigger className="w-32" data-testid="select-origin-filter">
                      <SelectValue placeholder="Origine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="global">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-blue-500" />
                          Globale
                        </div>
                      </SelectItem>
                      <SelectItem value="mine">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-green-500" />
                          Mio
                        </div>
                      </SelectItem>
                      <SelectItem value="reseller">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-orange-500" />
                          Reseller
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={compatibilityFilter} onValueChange={setCompatibilityFilter}>
                    <SelectTrigger className="w-36" data-testid="select-compatibility-filter">
                      <SelectValue placeholder="Compatibilità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="universal">Universale</SelectItem>
                      <SelectItem value="specific">Con restrizioni</SelectItem>
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
                        <TableHead>Compatibilità</TableHead>
                        <TableHead>Origine</TableHead>
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
                        const itemAny = item as any;
                        const deviceType = deviceTypes.find(t => t.id === itemAny.deviceTypeId);
                        const brand = deviceBrands.find(b => b.id === itemAny.brandId);
                        const model = deviceModels.find(m => m.id === itemAny.modelId);
                        const hasDeviceRestriction = itemAny.deviceTypeId || itemAny.brandId || itemAny.modelId;
                        const ownership = getOwnershipInfo(item, user?.id, (user as any)?.parentResellerId);
                        const OwnerIcon = ownership.icon;
                        
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
                            <TableCell>
                              {hasDeviceRestriction ? (
                                <div className="flex flex-wrap gap-1">
                                  {deviceType && (
                                    <Badge variant="outline" className="text-xs">
                                      <Smartphone className="h-3 w-3 mr-1" />
                                      {deviceType.name}
                                    </Badge>
                                  )}
                                  {brand && (
                                    <Badge variant="outline" className="text-xs">
                                      {brand.name}
                                    </Badge>
                                  )}
                                  {model && (
                                    <Badge variant="outline" className="text-xs">
                                      {model.modelName}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Universale</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1.5">
                                    <OwnerIcon className={`h-4 w-4 ${ownership.color}`} />
                                    <span className="text-xs">{ownership.label}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {ownership.label === "Globale" && "Servizio globale disponibile per tutti"}
                                  {ownership.label === "Mio" && "Servizio creato da te"}
                                  {ownership.label === "Reseller" && "Servizio del reseller principale"}
                                  {ownership.label === "Altro" && "Servizio di un altro utente"}
                                </TooltipContent>
                              </Tooltip>
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
                                    onClick={() => openDeletePriceDialog(item)}
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

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingServiceItem ? "Modifica Voce" : "Nuova Voce di Listino"}
            </DialogTitle>
            <DialogDescription>
              {editingServiceItem 
                ? "Modifica i dettagli della voce di listino" 
                : "Crea una nuova voce di listino personalizzata per il tuo catalogo"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Codice *</Label>
                <Input
                  id="itemCode"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="es. DISP-001"
                  data-testid="input-item-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemCategory">Categoria *</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger data-testid="select-item-category">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Nome *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="es. Sostituzione Display"
                data-testid="input-item-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemDescription">Descrizione (opzionale)</Label>
              <Textarea
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Descrizione dettagliata dell'intervento..."
                rows={3}
                data-testid="input-item-description"
              />
            </div>

            {/* Device compatibility filters */}
            <div className="space-y-2">
              <Label>Compatibilità Dispositivo (opzionale)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Seleziona per quale tipo/marca/modello di dispositivo è applicabile questo intervento
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select 
                  value={itemDeviceTypeId} 
                  onValueChange={(v) => {
                    setItemDeviceTypeId(v === "all" ? "" : v);
                    setItemBrandId("");
                    setItemModelId("");
                  }}
                >
                  <SelectTrigger data-testid="select-item-device-type">
                    <SelectValue placeholder="Tipo dispositivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    {deviceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={itemBrandId} 
                  onValueChange={(v) => {
                    setItemBrandId(v === "all" ? "" : v);
                    setItemModelId("");
                  }}
                >
                  <SelectTrigger data-testid="select-item-brand">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le marche</SelectItem>
                    {filteredBrands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={itemModelId} 
                  onValueChange={(v) => setItemModelId(v === "all" ? "" : v)}
                  disabled={!itemBrandId && !itemDeviceTypeId}
                >
                  <SelectTrigger data-testid="select-item-model">
                    <SelectValue placeholder="Modello" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i modelli</SelectItem>
                    {filteredModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemPrice">Prezzo (EUR) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPriceEuros}
                    onChange={(e) => setItemPriceEuros(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                    data-testid="input-item-price"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemLabor">Tempo Manodopera (min)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="itemLabor"
                    type="number"
                    min="0"
                    value={itemLaborMinutes}
                    onChange={(e) => setItemLaborMinutes(e.target.value)}
                    className="pl-9"
                    placeholder="60"
                    data-testid="input-item-labor"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsItemDialogOpen(false)}
              data-testid="button-cancel-item"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-save-item"
            >
              {(createItemMutation.isPending || updateItemMutation.isPending) 
                ? "Salvataggio..." 
                : (editingServiceItem ? "Salva Modifiche" : "Crea Intervento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeletePriceDialogOpen} onOpenChange={setIsDeletePriceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Prezzo Personalizzato</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il prezzo personalizzato per "{priceToDelete?.item.name}"?
              Verrà ripristinato il prezzo base o quello del rivenditore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-price">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => priceToDelete && deletePriceMutation.mutate(priceToDelete.priceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-price"
            >
              {deletePriceMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteItemDialogOpen} onOpenChange={setIsDeleteItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Intervento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'intervento "{itemToDelete?.name}"?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-item">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-item"
            >
              {deleteItemMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
