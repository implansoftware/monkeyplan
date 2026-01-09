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

const getPriceSourceLabel = (source: string) => {
  switch (source) {
    case 'center': return 'Proprio';
    case 'reseller': return 'Rivenditore';
    case 'base': return 'Listino Base';
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
      toast({ title: "Intervento creato", description: "Nuovo intervento aggiunto al listino" });
      closeItemDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile creare l'intervento",
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
      toast({ title: "Intervento aggiornato" });
      closeItemDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile aggiornare l'intervento",
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
      toast({ title: "Intervento eliminato" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile eliminare l'intervento",
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
        title: "Errore", 
        description: "Compila tutti i campi obbligatori",
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
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Wrench className="h-6 w-6" />
            Listino Interventi
          </h1>
          <p className="text-muted-foreground">
            Catalogo servizi con prezzi applicati al tuo centro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button size="sm" onClick={openNewItemDialog} data-testid="button-new-item">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Intervento
          </Button>
        </div>
      </div>

      {ownedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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
                    <TableHead>Codice</TableHead>
                    <TableHead>Intervento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
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
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.effectivePrice)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
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
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Catalogo Completo
          </CardTitle>
          <CardDescription>
            {items.length} interventi disponibili
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per codice, nome o descrizione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
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
                    <TableHead>Codice</TableHead>
                    <TableHead>Intervento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead>Origine</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
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
                      <TableCell>
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
                      <TableCell>
                        <Badge variant="outline" className={getPriceSourceColor(item.priceSource)}>
                          {getPriceSourceLabel(item.priceSource)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
              {editingItem ? "Modifica Intervento" : "Nuovo Intervento"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Modifica i dettagli dell'intervento"
                : "Crea un nuovo intervento nel tuo listino"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codice *</Label>
              <Input
                id="code"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="es. DISP-001"
                disabled={!!editingItem}
                data-testid="input-item-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="es. Sostituzione Display"
                data-testid="input-item-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Descrizione opzionale..."
                data-testid="input-item-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger data-testid="select-item-category">
                  <SelectValue placeholder="Seleziona categoria" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (EUR) *</Label>
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
                <Label htmlFor="labor">Tempo (min)</Label>
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
                ? "Salvataggio..." 
                : (editingItem ? "Salva Modifiche" : "Crea Intervento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Intervento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'intervento "{itemToDelete?.name}"?
              Questa azione non può essere annullata.
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
              {deleteItemMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
