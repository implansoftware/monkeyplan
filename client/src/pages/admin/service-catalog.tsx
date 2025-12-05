import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wrench, Plus, Pencil, Trash2, Euro, Clock, Package, 
  Filter, Search, ChevronRight, Tag, Building2 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Textarea } from "@/components/ui/textarea";
import type { ServiceItem, ServiceItemPrice, User } from "@shared/schema";

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

interface ServiceItemFormData {
  name: string;
  code: string;
  description: string;
  category: string;
  defaultPriceCents: number;
  defaultLaborMinutes: number;
  isActive: boolean;
}

const emptyFormData: ServiceItemFormData = {
  name: "",
  code: "",
  description: "",
  category: "altro",
  defaultPriceCents: 0,
  defaultLaborMinutes: 30,
  isActive: true,
};

interface PriceFormData {
  serviceItemId: string;
  resellerId?: string;
  repairCenterId?: string;
  priceCents: number;
  isActive: boolean;
}

const emptyPriceFormData: PriceFormData = {
  serviceItemId: "",
  priceCents: 0,
  isActive: true,
};

export default function AdminServiceCatalog() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [itemFormData, setItemFormData] = useState<ServiceItemFormData>(emptyFormData);
  const [priceEuros, setPriceEuros] = useState<string>("");
  
  const [selectedItemForPrices, setSelectedItemForPrices] = useState<ServiceItem | null>(null);
  const [priceFormData, setPriceFormData] = useState<PriceFormData>(emptyPriceFormData);
  const [priceTargetType, setPriceTargetType] = useState<"reseller" | "repair_center">("reseller");
  const [customPriceEuros, setCustomPriceEuros] = useState<string>("");
  
  const [itemToDelete, setItemToDelete] = useState<ServiceItem | null>(null);

  const { data: serviceItems, isLoading } = useQuery<ServiceItem[]>({
    queryKey: ["/api/admin/service-items"],
  });

  const { data: resellers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(u => u.role === "reseller"),
  });

  const { data: repairCenters } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(u => u.role === "repair_center"),
  });

  const { data: itemPrices, isLoading: pricesLoading } = useQuery<ServiceItemPrice[]>({
    queryKey: ["/api/admin/service-items", selectedItemForPrices?.id, "prices"],
    enabled: !!selectedItemForPrices,
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ServiceItemFormData) => {
      return await apiRequest("POST", "/api/admin/service-items", data);
    },
    onSuccess: () => {
      toast({ title: "Intervento Creato", description: "L'intervento è stato aggiunto al catalogo" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-items"] });
      setIsItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceItemFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/service-items/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Intervento Aggiornato", description: "Le modifiche sono state salvate" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-items"] });
      setIsItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/service-items/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Intervento Eliminato", description: "L'intervento è stato rimosso dal catalogo" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-items"] });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createPriceMutation = useMutation({
    mutationFn: async (data: PriceFormData) => {
      return await apiRequest("POST", "/api/admin/service-item-prices", data);
    },
    onSuccess: () => {
      toast({ title: "Prezzo Personalizzato Creato", description: "Il listino è stato aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-items", selectedItemForPrices?.id, "prices"] });
      setIsPriceDialogOpen(false);
      resetPriceForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deletePriceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/service-item-prices/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Prezzo Eliminato", description: "Il prezzo personalizzato è stato rimosso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-items", selectedItemForPrices?.id, "prices"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetItemForm = () => {
    setEditingItem(null);
    setItemFormData(emptyFormData);
    setPriceEuros("");
  };

  const resetPriceForm = () => {
    setPriceFormData(emptyPriceFormData);
    setCustomPriceEuros("");
    setPriceTargetType("reseller");
  };

  const handleEditItem = (item: ServiceItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      code: item.code,
      description: item.description || "",
      category: item.category,
      defaultPriceCents: item.defaultPriceCents,
      defaultLaborMinutes: item.defaultLaborMinutes,
      isActive: item.isActive,
    });
    setPriceEuros((item.defaultPriceCents / 100).toFixed(2));
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (item: ServiceItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveItem = () => {
    const cents = Math.round(parseFloat(priceEuros) * 100);
    if (isNaN(cents) || cents < 0) {
      toast({ title: "Errore", description: "Inserisci un prezzo valido", variant: "destructive" });
      return;
    }

    const data = { ...itemFormData, defaultPriceCents: cents };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleSavePrice = () => {
    if (!selectedItemForPrices) return;

    const cents = Math.round(parseFloat(customPriceEuros) * 100);
    if (isNaN(cents) || cents < 0) {
      toast({ title: "Errore", description: "Inserisci un prezzo valido", variant: "destructive" });
      return;
    }

    const data: PriceFormData = {
      serviceItemId: selectedItemForPrices.id,
      priceCents: cents,
      isActive: true,
    };

    if (priceTargetType === "reseller" && priceFormData.resellerId) {
      data.resellerId = priceFormData.resellerId;
    } else if (priceTargetType === "repair_center" && priceFormData.repairCenterId) {
      data.repairCenterId = priceFormData.repairCenterId;
    } else {
      toast({ title: "Errore", description: "Seleziona un reseller o un centro riparazioni", variant: "destructive" });
      return;
    }

    createPriceMutation.mutate(data);
  };

  const filteredItems = (serviceItems || []).filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getEntityName = (price: ServiceItemPrice) => {
    if (price.resellerId) {
      const reseller = resellers?.find(r => r.id === price.resellerId);
      return reseller?.ragioneSociale || reseller?.fullName || reseller?.username || "Reseller sconosciuto";
    }
    if (price.repairCenterId) {
      const center = repairCenters?.find(r => r.id === price.repairCenterId);
      return center?.ragioneSociale || center?.fullName || center?.username || "Centro sconosciuto";
    }
    return "N/A";
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Wrench className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogo Interventi</h1>
          <p className="text-muted-foreground">
            Gestisci gli interventi standard e i listini prezzi
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            Catalogo Interventi
          </TabsTrigger>
          <TabsTrigger value="prices" className="gap-2">
            <Euro className="h-4 w-4" />
            Listini Prezzi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Interventi Disponibili</CardTitle>
                  <CardDescription>
                    Definisci gli interventi standard e i prezzi base
                  </CardDescription>
                </div>
                <Button onClick={() => { resetItemForm(); setIsItemDialogOpen(true); }} data-testid="button-add-service-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Intervento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o codice..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-service"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun intervento trovato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Intervento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Prezzo Base</TableHead>
                      <TableHead className="text-right">Durata</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id} data-testid={`row-service-item-${item.id}`}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
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
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.defaultPriceCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.defaultLaborMinutes} min
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Attivo" : "Disattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setSelectedItemForPrices(item); setActiveTab("prices"); }}
                              title="Gestisci listini"
                              data-testid={`button-manage-prices-${item.id}`}
                            >
                              <Euro className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditItem(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item)}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Listini Prezzi Personalizzati
                  </CardTitle>
                  <CardDescription>
                    Imposta prezzi personalizzati per reseller e centri riparazioni
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedItemForPrices ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Seleziona un intervento dal catalogo per gestire i prezzi personalizzati
                  </p>
                  <div className="grid gap-2">
                    {(serviceItems || []).slice(0, 10).map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="justify-between"
                        onClick={() => setSelectedItemForPrices(item)}
                        data-testid={`button-select-item-${item.id}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">{item.code}</span>
                          <span>{item.name}</span>
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedItemForPrices.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Prezzo base: {formatCurrency(selectedItemForPrices.defaultPriceCents)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedItemForPrices(null)}>
                        Cambia Intervento
                      </Button>
                      <Button onClick={() => setIsPriceDialogOpen(true)} data-testid="button-add-custom-price">
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Prezzo
                      </Button>
                    </div>
                  </div>

                  {pricesLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : !itemPrices || itemPrices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Euro className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Nessun prezzo personalizzato per questo intervento</p>
                      <p className="text-sm">Verrà applicato il prezzo base a tutti</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Entità</TableHead>
                          <TableHead className="text-right">Prezzo</TableHead>
                          <TableHead className="text-right">Durata</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemPrices.map(price => (
                          <TableRow key={price.id} data-testid={`row-price-${price.id}`}>
                            <TableCell>
                              <Badge variant="outline">
                                {price.resellerId ? "Reseller" : "Centro"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getEntityName(price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(price.priceCents)}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedItemForPrices.defaultLaborMinutes} min
                            </TableCell>
                            <TableCell>
                              <Badge variant={price.isActive ? "default" : "secondary"}>
                                {price.isActive ? "Attivo" : "Disattivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deletePriceMutation.mutate(price.id)}
                                data-testid={`button-delete-price-${price.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica Intervento" : "Nuovo Intervento"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Modifica i dettagli dell'intervento" 
                : "Aggiungi un nuovo intervento al catalogo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Codice</Label>
                <Input
                  id="code"
                  placeholder="ES: DISP-001"
                  value={itemFormData.code}
                  onChange={(e) => setItemFormData({ ...itemFormData, code: e.target.value.toUpperCase() })}
                  data-testid="input-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={itemFormData.category}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Intervento</Label>
              <Input
                id="name"
                placeholder="Sostituzione Display"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Descrizione opzionale dell'intervento..."
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo Base (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceEuros}
                    onChange={(e) => setPriceEuros(e.target.value)}
                    className="pl-10"
                    data-testid="input-price"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="labor">Durata (minuti)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="labor"
                    type="number"
                    min="0"
                    value={itemFormData.defaultLaborMinutes}
                    onChange={(e) => setItemFormData({ ...itemFormData, defaultLaborMinutes: parseInt(e.target.value) || 0 })}
                    className="pl-10"
                    data-testid="input-labor"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={itemFormData.isActive}
                onCheckedChange={(checked) => setItemFormData({ ...itemFormData, isActive: checked })}
                data-testid="switch-active"
              />
              <Label htmlFor="active">Intervento attivo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsItemDialogOpen(false); resetItemForm(); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-save-item"
            >
              {editingItem ? "Salva Modifiche" : "Crea Intervento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuovo Prezzo Personalizzato</DialogTitle>
            <DialogDescription>
              Imposta un prezzo personalizzato per un reseller o centro riparazioni
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo di Destinatario</Label>
              <Select value={priceTargetType} onValueChange={(v: "reseller" | "repair_center") => setPriceTargetType(v)}>
                <SelectTrigger data-testid="select-price-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reseller">Reseller</SelectItem>
                  <SelectItem value="repair_center">Centro Riparazioni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceTargetType === "reseller" ? (
              <div className="space-y-2">
                <Label>Seleziona Reseller</Label>
                <Select
                  value={priceFormData.resellerId || ""}
                  onValueChange={(v) => setPriceFormData({ ...priceFormData, resellerId: v, repairCenterId: undefined })}
                >
                  <SelectTrigger data-testid="select-reseller">
                    <SelectValue placeholder="Seleziona un reseller..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers?.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.ragioneSociale || r.fullName || r.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Seleziona Centro Riparazioni</Label>
                <Select
                  value={priceFormData.repairCenterId || ""}
                  onValueChange={(v) => setPriceFormData({ ...priceFormData, repairCenterId: v, resellerId: undefined })}
                >
                  <SelectTrigger data-testid="select-repair-center">
                    <SelectValue placeholder="Seleziona un centro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repairCenters?.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.ragioneSociale || r.fullName || r.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Prezzo Personalizzato (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={customPriceEuros}
                  onChange={(e) => setCustomPriceEuros(e.target.value)}
                  className="pl-10"
                  data-testid="input-custom-price"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Durata intervento: {selectedItemForPrices?.defaultLaborMinutes} min (dal catalogo)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsPriceDialogOpen(false); resetPriceForm(); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSavePrice}
              disabled={createPriceMutation.isPending}
              data-testid="button-save-price"
            >
              Salva Prezzo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo intervento?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare l'intervento "{itemToDelete?.name}".
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
