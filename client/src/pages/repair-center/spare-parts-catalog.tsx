import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Wrench, Search, ShoppingCart, Eye, Cpu, Battery, Monitor, Camera, Mic, Speaker, Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

type SparePartWithStock = Product & {
  resellerStock: number;
  b2bPrice: number;
  availableForPurchase: boolean;
  deviceCompatibilities?: Array<{
    id: string;
    deviceBrandId: string;
    deviceModelId: string | null;
    deviceModel?: { id: string; modelName: string } | null;
    deviceBrand?: { id: string; name: string } | null;
  }>;
};

const PART_TYPES = [
  { value: "display", label: "Display/LCD", icon: Monitor },
  { value: "batteria", label: "Batterie", icon: Battery },
  { value: "fotocamera", label: "Fotocamere", icon: Camera },
  { value: "connettore", label: "Connettori Ricarica", icon: Cpu },
  { value: "altoparlante", label: "Altoparlanti", icon: Speaker },
  { value: "microfono", label: "Microfoni", icon: Mic },
  { value: "antenna", label: "Antenne/WiFi", icon: Wifi },
  { value: "scheda_madre", label: "Scheda Madre", icon: Cpu },
  { value: "vetro", label: "Vetri/Back Cover", icon: Monitor },
  { value: "altro", label: "Altro", icon: Wrench },
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Altro"];

export default function RepairCenterSparePartsCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePartWithStock | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const { toast } = useToast();

  const [cart, setCart] = useState<Array<{ productId: string; quantity: number; name: string; b2bPrice: number }>>(() => {
    const saved = localStorage.getItem('rc-b2b-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: spareParts = [], isLoading } = useQuery<SparePartWithStock[]>({
    queryKey: ["/api/repair-center/spare-parts-catalog"],
  });

  const filteredParts = spareParts.filter(part => {
    const matchesSearch = !searchQuery || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || part.category === typeFilter;
    const matchesBrand = brandFilter === "all" || part.brand === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  const addToCart = (part: SparePartWithStock, quantity: number) => {
    const existingIndex = cart.findIndex(item => item.productId === part.id);
    let newCart;
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, { 
        productId: part.id, 
        quantity, 
        name: part.name, 
        b2bPrice: part.b2bPrice 
      }];
    }
    setCart(newCart);
    localStorage.setItem('rc-b2b-cart', JSON.stringify(newCart));
    toast({
      title: "Aggiunto al carrello",
      description: `${part.name} x${quantity} aggiunto al carrello B2B`,
    });
    setBuyDialogOpen(false);
  };

  const getTypeInfo = (category: string | undefined | null) => {
    return PART_TYPES.find(t => t.value === category) || { value: "altro", label: "Altro", icon: Wrench };
  };

  const formatPrice = (cents: number | undefined | null) => {
    if (!cents) return "N/D";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.b2bPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Catalogo Ricambi</h1>
            <p className="text-muted-foreground">Ricambi disponibili dal tuo rivenditore</p>
          </div>
        </div>
        {cartItemCount > 0 && (
          <Button variant="outline" onClick={() => window.location.href = '/repair-center/b2b-catalog'} data-testid="button-view-cart">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Carrello ({cartItemCount}) - {formatPrice(cartTotal)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo ricambio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {PART_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-brand-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le marche</SelectItem>
                {BRANDS.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun ricambio trovato</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ricambio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead className="text-right">Prezzo B2B</TableHead>
                    <TableHead className="text-center">Disponibilità</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map(part => {
                    const typeInfo = getTypeInfo(part.category);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <TableRow key={part.id} data-testid={`row-part-${part.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {part.imageUrl ? (
                              <img 
                                src={part.imageUrl} 
                                alt={part.name} 
                                className="h-12 w-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                <TypeIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{part.name}</div>
                              <div className="text-sm text-muted-foreground">{part.brand} - {part.sku}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {part.deviceCompatibilities && part.deviceCompatibilities.length > 0 ? (
                              part.deviceCompatibilities.slice(0, 2).map((comp, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {comp.deviceBrand?.name} {comp.deviceModel?.modelName || ""}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            {part.deviceCompatibilities && part.deviceCompatibilities.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{part.deviceCompatibilities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(part.b2bPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {part.resellerStock > 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              {part.resellerStock} pz
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Esaurito</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedPart(part);
                                setDetailDialogOpen(true);
                              }}
                              data-testid={`button-view-${part.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              disabled={!part.availableForPurchase}
                              onClick={() => {
                                setSelectedPart(part);
                                setBuyQuantity(1);
                                setBuyDialogOpen(true);
                              }}
                              data-testid={`button-buy-${part.id}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Acquista
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {selectedPart?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPart?.brand} - SKU: {selectedPart?.sku}
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Prezzo B2B</Label>
                  <p className="text-2xl font-bold text-primary">{formatPrice(selectedPart.b2bPrice)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disponibilità</Label>
                  <p className="text-lg font-medium">{selectedPart.resellerStock} pezzi</p>
                </div>
              </div>
              
              {selectedPart.description && (
                <div>
                  <Label className="text-muted-foreground">Descrizione</Label>
                  <p className="mt-1">{selectedPart.description}</p>
                </div>
              )}

              {selectedPart.deviceCompatibilities && selectedPart.deviceCompatibilities.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Compatibilità Dispositivi</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPart.deviceCompatibilities.map((comp, idx) => (
                      <Badge key={idx} variant="outline">
                        {comp.deviceBrand?.name} {comp.deviceModel?.modelName || ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
            {selectedPart?.availableForPurchase && (
              <Button onClick={() => {
                setDetailDialogOpen(false);
                setBuyQuantity(1);
                setBuyDialogOpen(true);
              }}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acquista
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi al Carrello B2B</DialogTitle>
            <DialogDescription>
              {selectedPart?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prezzo unitario</Label>
                  <p className="text-lg font-bold">{formatPrice(selectedPart.b2bPrice)}</p>
                </div>
                <div>
                  <Label>Disponibili</Label>
                  <p className="text-lg">{selectedPart.resellerStock} pz</p>
                </div>
              </div>
              <div>
                <Label>Quantità</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={selectedPart.resellerStock}
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Math.min(parseInt(e.target.value) || 1, selectedPart.resellerStock))}
                  data-testid="input-quantity"
                />
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Totale</span>
                  <span className="font-bold text-lg">{formatPrice(selectedPart.b2bPrice * buyQuantity)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => selectedPart && addToCart(selectedPart, buyQuantity)} data-testid="button-confirm-add">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Aggiungi al Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
