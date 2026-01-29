import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, Wrench, Euro, Search, Users, Building2, Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PriceList, PriceListItem, Product, ServiceItem, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type PriceListWithItems = PriceList & { items: PriceListItem[] };

export default function AdminPriceListDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/price-lists/:id");
  const listId = params?.id;
  const [search, setSearch] = useState("");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const [newItemPrice, setNewItemPrice] = useState("");

  const { data: priceList, isLoading } = useQuery<PriceListWithItems>({
    queryKey: ["/api/admin/price-lists", listId],
    enabled: !!listId,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: services } = useQuery<ServiceItem[]>({
    queryKey: ["/api/service-items"],
  });

  const { data: owner } = useQuery<User>({
    queryKey: ["/api/users", priceList?.ownerId],
    enabled: !!priceList?.ownerId,
  });

  const isAdminList = priceList?.ownerType === "admin";

  const addItemMutation = useMutation({
    mutationFn: async (data: { productId?: string; serviceItemId?: string; priceCents: number }) => {
      return apiRequest("POST", `/api/price-lists/${listId}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-lists", listId] });
      setAddItemDialogOpen(false);
      setSelectedProductId(null);
      setSelectedServiceId(null);
      setSelectedProductName(null);
      setSelectedServiceName(null);
      setNewItemPrice("");
      toast({
        title: "Voce aggiunta",
        description: "La voce è stata aggiunta al listino.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta della voce.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/price-list-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-lists", listId] });
      toast({
        title: "Voce eliminata",
        description: "La voce è stata rimossa dal listino.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della voce.",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    const priceCents = Math.round(parseFloat(newItemPrice) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci un prezzo valido.",
        variant: "destructive",
      });
      return;
    }

    if (itemType === "product" && selectedProductId) {
      addItemMutation.mutate({ productId: selectedProductId, priceCents });
    } else if (itemType === "service" && selectedServiceId) {
      addItemMutation.mutate({ serviceItemId: selectedServiceId, priceCents });
    } else {
      toast({
        title: "Errore",
        description: "Seleziona un prodotto o servizio.",
        variant: "destructive",
      });
    }
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

  const filteredItems = priceList?.items?.filter(item => {
    const name = getItemName(item).toLowerCase();
    return name.includes(search.toLowerCase());
  }) || [];

  const getTargetAudienceLabel = (target: string | null) => {
    switch (target) {
      case "all": return "Tutti";
      case "sub_reseller": return "Sub-Rivenditori";
      case "repair_center": return "Centri Riparazione";
      case "customer": return "Clienti";
      case "reseller": return "Rivenditori";
      default: return "Tutti";
    }
  };

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
        <Link href="/admin/price-lists">
          <Button variant="ghost">Torna ai listini</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/price-lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {isAdminList && <Shield className="h-5 w-5 text-emerald-500" />}
              <h1 className="text-2xl font-bold" data-testid="text-list-name">{priceList.name}</h1>
            </div>
            {priceList.description && (
              <p className="text-muted-foreground">{priceList.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdminList && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              Tuo Listino
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {getTargetAudienceLabel(priceList.targetAudience)}
          </Badge>
          <Badge variant={priceList.isActive ? "default" : "secondary"}>
            {priceList.isActive ? "Attivo" : "Disattivato"}
          </Badge>
        </div>
      </div>

      {owner && !isAdminList && (
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Proprietario: {owner.fullName}</p>
                <p className="text-xs text-muted-foreground">{owner.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-500" />
                Voci del Listino
              </CardTitle>
              <CardDescription>
                {filteredItems.length} voci nel listino {!isAdminList && "(sola lettura)"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              {isAdminList && (
                <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-item">
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Aggiungi Voce al Listino</DialogTitle>
                      <DialogDescription>
                        Seleziona un prodotto o servizio e imposta il prezzo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={itemType} onValueChange={(v) => {
                          setItemType(v as "product" | "service");
                          setSelectedProductId(null);
                          setSelectedServiceId(null);
                          setSelectedProductName(null);
                          setSelectedServiceName(null);
                        }}>
                          <SelectTrigger data-testid="select-item-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Prodotto</SelectItem>
                            <SelectItem value="service">Servizio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {itemType === "product" ? (
                        <div className="space-y-2">
                          <Label>Prodotto</Label>
                          <SearchableProductCombobox
                            onSelect={(product) => {
                              setSelectedProductId(product.id);
                              setSelectedProductName(product.name);
                            }}
                            placeholder="Cerca prodotto..."
                          />
                          {selectedProductName && (
                            <div className="p-2 rounded-md bg-muted/50 border">
                              <p className="text-sm font-medium">{selectedProductName}</p>
                              <p className="text-xs text-muted-foreground">Prodotto selezionato</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Servizio</Label>
                          <SearchableServiceCombobox
                            onSelect={(service) => {
                              setSelectedServiceId(service.id);
                              setSelectedServiceName(service.name);
                            }}
                            placeholder="Cerca servizio..."
                          />
                          {selectedServiceName && (
                            <div className="p-2 rounded-md bg-muted/50 border">
                              <p className="text-sm font-medium">{selectedServiceName}</p>
                              <p className="text-xs text-muted-foreground">Servizio selezionato</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Prezzo (EUR)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="es. 99.99"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          data-testid="input-item-price"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                        Annulla
                      </Button>
                      <Button
                        onClick={handleAddItem}
                        disabled={addItemMutation.isPending}
                        data-testid="button-confirm-add-item"
                      >
                        {addItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Aggiungi
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna voce nel listino</p>
              {isAdminList && (
                <p className="text-sm mt-2">Clicca "Aggiungi" per inserire prodotti o servizi</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Prezzo Originale</TableHead>
                  <TableHead className="text-right">Prezzo Listino</TableHead>
                  {isAdminList && <TableHead className="w-[80px]">Azioni</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const imageUrl = getItemImage(item);
                  const originalPrice = getItemOriginalPrice(item);
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
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.priceCents)}
                      </TableCell>
                      {isAdminList && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            disabled={deleteItemMutation.isPending}
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
