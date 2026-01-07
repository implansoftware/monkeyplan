import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Search, ShoppingCart, Eye, Headphones, Cable, Battery, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { AccessorySpecs, Product } from "@shared/schema";

type AccessoryWithSpecs = Product & {
  specs: AccessorySpecs | null;
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

const ACCESSORY_TYPES = [
  { value: "cover", label: "Cover/Custodie", icon: Shield },
  { value: "pellicola", label: "Pellicole Protettive", icon: Shield },
  { value: "caricatore", label: "Caricatori", icon: Battery },
  { value: "cavo", label: "Cavi", icon: Cable },
  { value: "powerbank", label: "Power Bank", icon: Battery },
  { value: "auricolari", label: "Auricolari/Cuffie", icon: Headphones },
  { value: "supporto", label: "Supporti", icon: Package },
  { value: "adattatore", label: "Adattatori", icon: Cable },
  { value: "memoria", label: "Schede Memoria", icon: Package },
  { value: "altro", label: "Altro", icon: Package },
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Universale", "Altro"];

export default function RepairCenterAccessoryCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<AccessoryWithSpecs | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const { toast } = useToast();

  const [cart, setCart] = useState<Array<{ productId: string; quantity: number; name: string; b2bPrice: number }>>(() => {
    const saved = localStorage.getItem('rc-b2b-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: accessories = [], isLoading } = useQuery<AccessoryWithSpecs[]>({
    queryKey: ["/api/repair-center/accessory-catalog"],
  });

  const filteredAccessories = accessories.filter(acc => {
    const matchesSearch = !searchQuery || 
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || acc.specs?.accessoryType === typeFilter;
    const matchesBrand = brandFilter === "all" || acc.brand === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  const addToCart = (accessory: AccessoryWithSpecs, quantity: number) => {
    const existingIndex = cart.findIndex(item => item.productId === accessory.id);
    let newCart;
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, { 
        productId: accessory.id, 
        quantity, 
        name: accessory.name, 
        b2bPrice: accessory.b2bPrice 
      }];
    }
    setCart(newCart);
    localStorage.setItem('rc-b2b-cart', JSON.stringify(newCart));
    toast({
      title: "Aggiunto al carrello",
      description: `${accessory.name} x${quantity} aggiunto al carrello B2B`,
    });
    setBuyDialogOpen(false);
  };

  const getTypeInfo = (type: string | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type) || { value: "altro", label: "Altro", icon: Package };
  };

  const formatPrice = (cents: number | undefined | null) => {
    if (!cents) return "N/D";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.b2bPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Catalogo Accessori</h1>
              <p className="text-sm text-muted-foreground">Accessori disponibili dal tuo rivenditore</p>
            </div>
          </div>
          {cartItemCount > 0 && (
            <Button variant="outline" className="shadow-lg shadow-primary/25" onClick={() => window.location.href = '/repair-center/b2b-catalog'} data-testid="button-view-cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrello ({cartItemCount}) - {formatPrice(cartTotal)}
            </Button>
          )}
        </div>
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
                <SelectValue placeholder="Tipo accessorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {ACCESSORY_TYPES.map(type => (
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
          ) : filteredAccessories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun accessorio trovato</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead className="text-right">Prezzo B2B</TableHead>
                    <TableHead className="text-center">Disponibilità</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map(acc => {
                    const typeInfo = getTypeInfo(acc.specs?.accessoryType);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <TableRow key={acc.id} data-testid={`row-accessory-${acc.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {acc.imageUrl ? (
                              <img 
                                src={acc.imageUrl} 
                                alt={acc.name} 
                                className="h-12 w-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                <TypeIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{acc.name}</div>
                              <div className="text-sm text-muted-foreground">{acc.brand} - {acc.sku}</div>
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
                            {acc.specs?.isUniversal ? (
                              <Badge variant="secondary">Universale</Badge>
                            ) : acc.deviceCompatibilities && acc.deviceCompatibilities.length > 0 ? (
                              acc.deviceCompatibilities.slice(0, 2).map((comp, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {comp.deviceBrand?.name || "N/D"} {comp.deviceModel?.modelName || ""}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">N/D</span>
                            )}
                            {acc.deviceCompatibilities && acc.deviceCompatibilities.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{acc.deviceCompatibilities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(acc.b2bPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {acc.availableForPurchase ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Package className="h-3 w-3 mr-1" />
                              {acc.resellerStock} disponibili
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Non disponibile
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedAccessory(acc);
                                setDetailDialogOpen(true);
                              }}
                              data-testid={`button-view-${acc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {acc.availableForPurchase && (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedAccessory(acc);
                                  setBuyQuantity(1);
                                  setBuyDialogOpen(true);
                                }}
                                data-testid={`button-add-cart-${acc.id}`}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
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
              <Package className="h-5 w-5" />
              Dettagli Accessorio
            </DialogTitle>
          </DialogHeader>
          {selectedAccessory && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedAccessory.imageUrl ? (
                  <img 
                    src={selectedAccessory.imageUrl} 
                    alt={selectedAccessory.name} 
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedAccessory.name}</h3>
                  <p className="text-muted-foreground">{selectedAccessory.brand} - SKU: {selectedAccessory.sku}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">
                      {getTypeInfo(selectedAccessory.specs?.accessoryType).label}
                    </Badge>
                    <Badge variant="outline">{selectedAccessory.condition || "N/D"}</Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-primary">{formatPrice(selectedAccessory.b2bPrice)}</span>
                    <span className="text-sm text-muted-foreground ml-2">Prezzo B2B</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Specifiche</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materiale:</span>
                      <span>{selectedAccessory.specs?.material || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Colore:</span>
                      <span>{selectedAccessory.specs?.color || selectedAccessory.color || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Garanzia:</span>
                      <span>{selectedAccessory.warrantyMonths ? `${selectedAccessory.warrantyMonths} mesi` : "N/D"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Compatibilità</h4>
                  {selectedAccessory.specs?.isUniversal ? (
                    <Badge variant="secondary">Universale</Badge>
                  ) : selectedAccessory.deviceCompatibilities && selectedAccessory.deviceCompatibilities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedAccessory.deviceCompatibilities.map((comp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {comp.deviceBrand?.name} {comp.deviceModel?.modelName || ""}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Non specificata</span>
                  )}
                </div>
              </div>

              {selectedAccessory.description && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Descrizione</h4>
                  <p className="text-sm text-muted-foreground">{selectedAccessory.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
            {selectedAccessory?.availableForPurchase && (
              <Button onClick={() => {
                setDetailDialogOpen(false);
                setBuyQuantity(1);
                setBuyDialogOpen(true);
              }}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Aggiungi al Carrello
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
              Aggiungi questo accessorio al tuo ordine B2B
            </DialogDescription>
          </DialogHeader>
          {selectedAccessory && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedAccessory.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedAccessory.brand} - {getTypeInfo(selectedAccessory.specs?.accessoryType).label}</p>
                <p className="text-lg font-bold mt-2">{formatPrice(selectedAccessory.b2bPrice)}</p>
                <p className="text-sm text-muted-foreground">Disponibili: {selectedAccessory.resellerStock}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantità:</span>
                <Input 
                  type="number" 
                  value={buyQuantity} 
                  onChange={(e) => setBuyQuantity(Math.max(1, Math.min(selectedAccessory.resellerStock, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={selectedAccessory.resellerStock}
                  className="w-24"
                  data-testid="input-quantity"
                />
              </div>
              <div className="flex justify-between font-bold">
                <span>Totale:</span>
                <span>{formatPrice(selectedAccessory.b2bPrice * buyQuantity)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => selectedAccessory && addToCart(selectedAccessory, buyQuantity)} data-testid="button-confirm-add">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Aggiungi al Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
