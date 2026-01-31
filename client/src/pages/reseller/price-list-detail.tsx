import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Pencil, Trash2, Package, Wrench, Euro, Search, Save, Percent
} from "lucide-react";
import { VAT_RATES } from "@/lib/utils";
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
import type { PriceList, PriceListItem, Product, ServiceItem } from "@shared/schema";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type PriceListWithItems = PriceList & { items: PriceListItem[] };

export default function PriceListDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/reseller/price-lists/:id");
  const listId = params?.id;

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PriceListItem | null>(null);
  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [selectedId, setSelectedId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [priceCents, setPriceCents] = useState("");
  const [selectedVatRate, setSelectedVatRate] = useState<number | null>(null);

  const { data: priceList, isLoading } = useQuery<PriceListWithItems>({
    queryKey: ["/api/price-lists", listId],
    enabled: !!listId,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: services } = useQuery<ServiceItem[]>({
    queryKey: ["/api/service-items"],
  });

  const updateVatMutation = useMutation({
    mutationFn: async (vatRate: number) => {
      return apiRequest("PUT", `/api/price-lists/${listId}`, { 
        name: priceList?.name,
        description: priceList?.description,
        isDefault: priceList?.isDefault,
        isActive: priceList?.isActive,
        targetAudience: priceList?.targetAudience,
        targetCustomerType: (priceList as any)?.targetCustomerType,
        defaultVatRate: vatRate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", listId] });
      toast({
        title: "Aliquota IVA aggiornata",
        description: "L'aliquota IVA del listino è stata aggiornata.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento dell'aliquota.",
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { productId?: string; serviceItemId?: string; priceCents: number; costPriceCents?: number; vatRate?: number }) => {
      return apiRequest("POST", `/api/price-lists/${listId}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", listId] });
      toast({ title: "Voce aggiunta", description: "Il prezzo è stato aggiunto al listino" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { priceCents?: number; costPriceCents?: number } }) => {
      return apiRequest("PUT", `/api/price-list-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", listId] });
      toast({ title: "Voce aggiornata", description: "Il prezzo è stato aggiornato" });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/price-list-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", listId] });
      toast({ title: "Voce eliminata", description: "Il prezzo è stato rimosso dal listino" });
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowAddDialog(false);
    setSelectedId("");
    setSelectedProduct(null);
    setSelectedService(null);
    setPriceCents("");
    setItemType("product");
    setSelectedVatRate(null);
  };

  const handleAddSubmit = () => {
    if (!selectedId || !priceCents) {
      toast({ title: "Errore", description: "Seleziona un elemento e inserisci il prezzo", variant: "destructive" });
      return;
    }
    
    const data: any = {
      priceCents: Math.round(parseFloat(priceCents) * 100),
    };
    
    if (itemType === "product") {
      data.productId = selectedId;
    } else {
      data.serviceItemId = selectedId;
    }
    
    if (selectedVatRate !== null) {
      data.vatRate = selectedVatRate;
    }
    
    addItemMutation.mutate(data);
  };

  const handleUpdateSubmit = () => {
    if (!editingItem || !priceCents) return;
    
    const data: any = {
      priceCents: Math.round(parseFloat(priceCents) * 100),
    };
    
    updateItemMutation.mutate({ id: editingItem.id, data });
  };

  const getItemName = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.name || "Prodotto sconosciuto";
    }
    if (item.serviceItemId) {
      const service = services?.find(s => s.id === item.serviceItemId);
      return service?.name || "Servizio sconosciuto";
    }
    return "Sconosciuto";
  };

  const getItemType = (item: PriceListItem) => {
    return item.productId ? "product" : "service";
  };

  const getItemImage = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.imageUrl || null;
    }
    return null;
  };

  const getItemOriginalPrice = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.unitPrice || null;
    }
    if (item.serviceItemId) {
      const service = services?.find(s => s.id === item.serviceItemId);
      return service?.defaultPriceCents || null;
    }
    return null;
  };

  const getItemCost = (item: PriceListItem) => {
    if (item.productId) {
      const product = products?.find(p => p.id === item.productId);
      return product?.costPrice || null;
    }
    return null;
  };

  const filteredItems = priceList?.items?.filter(item => {
    const name = getItemName(item).toLowerCase();
    return name.includes(search.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p className="text-muted-foreground">Listino non trovato</p>
        <Link href="/reseller/price-lists">
          <Button variant="ghost">Torna ai listini</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reseller/price-lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-list-name">{priceList.name}</h1>
            {priceList.description && (
              <p className="text-muted-foreground">{priceList.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Select
              value={String((priceList as any).defaultVatRate || 22)}
              onValueChange={(value) => updateVatMutation.mutate(Number(value))}
            >
              <SelectTrigger className="w-[140px]" data-testid="select-list-vat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAT_RATES.map((rate) => (
                  <SelectItem key={rate.value} value={String(rate.value)}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Voce
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-500" />
                Voci del Listino
              </CardTitle>
              <CardDescription>
                {filteredItems.length} voci nel listino
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna voce nel listino</p>
              <p className="text-sm">Aggiungi prodotti o servizi per definire i prezzi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Prezzo Originale</TableHead>
                  <TableHead className="text-right">Prezzo Costo</TableHead>
                  <TableHead className="text-right">Prezzo Listino</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const imageUrl = getItemImage(item);
                  const originalPrice = getItemOriginalPrice(item);
                  const costPrice = getItemCost(item);
                  const isProduct = getItemType(item) === "product";
                  return (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : isProduct ? (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Wrench className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{getItemName(item)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {isProduct ? (
                          <><Package className="h-3 w-3 mr-1" /> Prodotto</>
                        ) : (
                          <><Wrench className="h-3 w-3 mr-1" /> Servizio</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {originalPrice ? formatCurrency(originalPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {costPrice ? formatCurrency(costPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.priceCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {item.vatRate ?? (priceList as any).defaultVatRate ?? 22}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setPriceCents((item.priceCents / 100).toFixed(2));
                            setEditingItem(item);
                          }}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteItem(item)}
                          data-testid={`button-delete-${item.id}`}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Voce al Listino</DialogTitle>
            <DialogDescription>
              Seleziona un prodotto o servizio e definisci il prezzo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={itemType} onValueChange={(v) => { setItemType(v as "product" | "service"); setSelectedId(""); setSelectedProduct(null); setSelectedService(null); }}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Prodotto</SelectItem>
                  <SelectItem value="service">Servizio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{itemType === "product" ? "Prodotto" : "Servizio"}</Label>
              {itemType === "product" ? (
                <SearchableProductCombobox
                  onSelect={(product) => {
                    setSelectedId(product.id);
                    setSelectedProduct(product);
                    setSelectedService(null);
                  }}
                  placeholder="Cerca prodotto per nome..."
                />
              ) : (
                <SearchableServiceCombobox
                  onSelect={(service) => {
                    setSelectedId(service.id);
                    setSelectedService(service);
                    setSelectedProduct(null);
                  }}
                  placeholder="Cerca servizio per nome..."
                />
              )}
            </div>

            {selectedId && (selectedProduct || selectedService) && (
              <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50 border">
                {itemType === "product" && selectedProduct && (
                  <>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {selectedProduct.imageUrl ? (
                        <img 
                          src={selectedProduct.imageUrl} 
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Prezzo originale: <span className="font-semibold text-foreground">{formatCurrency(selectedProduct.unitPrice)}</span>
                      </p>
                      {selectedProduct.costPrice && (
                        <p className="text-xs text-muted-foreground">
                          Costo: {formatCurrency(selectedProduct.costPrice)}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {itemType === "service" && selectedService && (
                  <>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      <Wrench className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedService.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Prezzo base: <span className="font-semibold text-foreground">{formatCurrency(selectedService.defaultPriceCents)}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="price">Prezzo Vendita *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                data-testid="input-price"
              />
            </div>
            
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Aliquota IVA (opzionale)
                </span>
              </Label>
              <Select
                value={selectedVatRate !== null ? String(selectedVatRate) : "default"}
                onValueChange={(value) => setSelectedVatRate(value === "default" ? null : Number(value))}
              >
                <SelectTrigger data-testid="select-item-vat">
                  <SelectValue placeholder="Usa default listino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Usa default listino ({(priceList as any)?.defaultVatRate || 22}%)</SelectItem>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={String(rate.value)}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lascia vuoto per usare l'aliquota default del listino
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annulla</Button>
            <Button
              onClick={handleAddSubmit}
              disabled={addItemMutation.isPending}
              data-testid="button-submit-add"
            >
              {addItemMutation.isPending ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Prezzo</DialogTitle>
            <DialogDescription>
              Modifica il prezzo per questa voce del listino
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Prezzo Vendita *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                data-testid="input-edit-price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Annulla</Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={updateItemMutation.isPending}
              data-testid="button-submit-edit"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateItemMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere questa voce dal listino?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteItemMutation.mutate(deleteItem.id)}
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
