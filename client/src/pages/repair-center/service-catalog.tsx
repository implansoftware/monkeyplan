import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wrench, Euro, Clock, Search, Tag, RefreshCw, Plus, Pencil, Trash2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ServiceItem } from "@shared/schema";


const CATEGORY_KEYS: Record<string, string> = {
  display: "spareParts.displayLcd",
  batteria: "settings.battery",
  software: "",
  hardware: "",
  diagnostica: "sidebar.items.diagnostics",
  altro: "common.more",
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


const getPriceSourceLabel = (source: string, t: (key: string) => string) => {
  switch (source) {
    case 'center': return t("products.priceSourceOwn");
    case 'reseller': return t("products.priceSourceReseller");
    case 'base': return t("products.priceSourceBase");
    default: return source;
  }
};

const getPriceSourceColor = (source: string) => {
  switch (source) {
    case 'center': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'reseller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'base': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

interface ServiceCatalogItem extends ServiceItem {
  effectivePrice: number;
  effectiveLaborMinutes: number;
  priceSource: 'base' | 'reseller' | 'center';
  isOwned: boolean;
}

export default function RepairCenterServiceCatalog() {
  const { t } = useTranslation();

  const getCategoryLabel = (category: string) => {
    const key = CATEGORY_KEYS[category];
    if (key) return t(key);
    if (category === "software") return "Software";
    if (category === "hardware") return "Hardware";
    return category;
  };

  const SERVICE_CATEGORIES = [
    { value: "display", label: t("spareParts.displayLcd") },
    { value: "batteria", label: t("settings.battery") },
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "diagnostica", label: t("sidebar.items.diagnostics") },
    { value: "altro", label: t("common.more") },
  ];
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServiceCatalogItem | null>(null);
  
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPriceEuros, setItemPriceEuros] = useState("");
  const [itemLaborMinutes, setItemLaborMinutes] = useState("60");

  const { data: items = [], isLoading, refetch } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/repair-center/service-catalog"],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/repair-center/service-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/service-catalog"] });
      toast({ title: t("serviceCatalog.serviceCreated"), description: t("serviceCatalog.newServiceAdded") });
      closeItemDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.error"), 
        description: error.message || t("serviceCatalog.cannotCreateService"),
        variant: "destructive"
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/service-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/service-catalog"] });
      toast({ title: t("serviceCatalog.serviceUpdated") });
      closeItemDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.error"), 
        description: error.message || t("serviceCatalog.cannotUpdateService"),
        variant: "destructive"
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/repair-center/service-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/service-catalog"] });
      toast({ title: t("serviceCatalog.serviceDeleted") });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.error"), 
        description: error.message || t("serviceCatalog.cannotDeleteService"),
        variant: "destructive"
      });
    },
  });

  const openNewItemDialog = () => {
    setEditingItem(null);
    setItemCode("");
    setItemName("");
    setItemDescription("");
    setItemCategory("");
    setItemPriceEuros("");
    setItemLaborMinutes("60");
    setIsItemDialogOpen(true);
  };

  const openEditItemDialog = (item: ServiceCatalogItem) => {
    setEditingItem(item);
    setItemCode(item.code);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemCategory(item.category);
    setItemPriceEuros((item.defaultPriceCents / 100).toString());
    setItemLaborMinutes(item.defaultLaborMinutes?.toString() || "60");
    setIsItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setIsItemDialogOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = () => {
    if (!itemCode || !itemName || !itemCategory || !itemPriceEuros) {
      toast({ 
        title: t("auth.error"), 
        description: t("common.fillRequiredFields"),
        variant: "destructive"
      });
      return;
    }

    const priceCents = Math.round(parseFloat(itemPriceEuros) * 100);
    const laborMins = parseInt(itemLaborMinutes) || 60;

    if (editingItem) {
      updateItemMutation.mutate({
        id: editingItem.id,
        data: {
          name: itemName,
          description: itemDescription || null,
          category: itemCategory,
          defaultPriceCents: priceCents,
          defaultLaborMinutes: laborMins,
        },
      });
    } else {
      createItemMutation.mutate({
        code: itemCode,
        name: itemName,
        description: itemDescription || null,
        category: itemCategory,
        defaultPriceCents: priceCents,
        defaultLaborMinutes: laborMins,
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const ownedItems = items.filter(i => i.isOwned);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Wrench className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("sidebar.items.serviceCatalog")}</h1>
              <p className="text-emerald-100">{t("services.catalogoServiziConPrezziApplicatiAlTuoCentr")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" onClick={openNewItemDialog} data-testid="button-new-item">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Intervento
          </Button>
          </div>
        </div>
      </div>

      {ownedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <Tag className="h-5 w-5" />
              I Miei Interventi
            </CardTitle>
            <CardDescription>
              {ownedItems.length} interventi creati da te
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.code")}</TableHead>
                    <TableHead>{t("products.intervention")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("common.category")}</TableHead>
                    <TableHead className="text-right">{t("common.price")}</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Tempo</TableHead>
                    <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownedItems.map(item => (
                    <TableRow key={item.id} data-testid={`row-owned-${item.id}`}>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.effectivePrice)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                        {item.effectiveLaborMinutes} min
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditItemDialog(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setItemToDelete(item); setIsDeleteDialogOpen(true); }}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Tag className="h-5 w-5" />
            Catalogo Completo
          </CardTitle>
          <CardDescription>
            {items.length} interventi disponibili
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("services.cercaPerCodiceNomeODescrizione")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category">
                <SelectValue placeholder={t("common.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("warehouse.allCategories")}</SelectItem>
                {SERVICE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun intervento trovato
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.code")}</TableHead>
                    <TableHead>{t("products.intervention")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("common.category")}</TableHead>
                    <TableHead className="text-right">{t("common.price")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("shipping.origin")}</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id} data-testid={`row-service-${item.id}`}>
                      <TableCell className="font-mono text-sm">
                        {item.code}
                        {item.isOwned && (
                          <Badge variant="outline" className="ml-2 text-xs">Mio</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(item.effectivePrice)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getPriceSourceColor(item.priceSource)}>
                          {getPriceSourceLabel(item.priceSource, t)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {item.effectiveLaborMinutes} min
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("serviceCatalog.editService") : "Nuovo Intervento"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? t("serviceCatalog.editServiceDetails")
                : t("serviceCatalog.createNewService")
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("serviceCatalog.codiceRequired")}</Label>
              <Input
                id="code"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder={t("serviceCatalog.placeholderCode")}
                disabled={!!editingItem}
                data-testid="input-item-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("services.nome")}</Label>
              <Input
                id="name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t("serviceCatalog.placeholderName")}
                data-testid="input-item-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder={t("utility.optionalDescription")}
                data-testid="input-item-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t("services.categoria")}</Label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger data-testid="select-item-category">
                  <SelectValue placeholder={t("utility.selectCategory")} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("services.prezzoEUR")}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPriceEuros}
                  onChange={(e) => setItemPriceEuros(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-item-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labor">{t("serviceCatalog.tempoMin")}</Label>
                <Input
                  id="labor"
                  type="number"
                  min="0"
                  value={itemLaborMinutes}
                  onChange={(e) => setItemLaborMinutes(e.target.value)}
                  placeholder="60"
                  data-testid="input-item-labor"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeItemDialog}>
              Annulla
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-save-item"
            >
              {(createItemMutation.isPending || updateItemMutation.isPending) 
                ? t("settings.saving") 
                : (editingItem ? t("team.saveChanges") : t("serviceCatalog.createService"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("services.eliminaIntervento")}</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'intervento "{itemToDelete?.name}"?
              {t("common.thisActionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteItemMutation.isPending ? "Eliminazione..." : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
