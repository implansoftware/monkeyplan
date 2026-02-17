import { useTranslation } from "react-i18next";
import { useState } from "react";
import { BarcodeDisplay } from "@/components/barcode-display";
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


const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Universale", "Altro"];

export default function RepairCenterAccessoryCatalog() {
  const { t } = useTranslation();
  const ACCESSORY_TYPES = [
    { value: "cover", label: t("accessories.cover"), icon: Shield },
    { value: "pellicola", label: t("accessories.pellicole"), icon: Shield },
    { value: "caricatore", label: t("accessories.caricatori"), icon: Battery },
    { value: "cavo", label: t("accessories.cavi"), icon: Cable },
    { value: "powerbank", label: t("accessories.powerBank"), icon: Battery },
    { value: "auricolari", label: t("accessories.auricolari"), icon: Headphones },
    { value: "supporto", label: t("accessories.supporti"), icon: Package },
    { value: "adattatore", label: t("accessories.adattatori"), icon: Cable },
    { value: "memoria", label: t("accessories.schedeMemoria"), icon: Package },
    { value: "altro", label: t("common.more"), icon: Package },
  ];
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
      title: t("catalog.addedToCart"),
      description: t("accessories.aggiuntoAlCarrelloB2B", { name: accessory.name, quantity }),
    });
    setBuyDialogOpen(false);
  };

  const getTypeInfo = (type: string | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type) || { value: "altro", label: t("common.more"), icon: Package };
  };

  const formatPrice = (cents: number | undefined | null) => {
    if (!cents) return "N/D";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.b2bPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Package className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("products.accessoryCatalog")}</h1>
              <p className="text-emerald-100">{t("accessories.accessoriDisponibiliDalTuoRivenditore")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cartItemCount > 0 && (
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" onClick={() => window.location.href = '/repair-center/b2b-catalog'} data-testid="button-view-cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("accessories.carrello")} ({cartItemCount}) - {formatPrice(cartTotal)}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("accessories.cercaPerNomeOSKU")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-type-filter">
                <SelectValue placeholder={t("products.accessoryType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                {ACCESSORY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-brand-filter">
                <SelectValue placeholder={t("repairs.deviceBrand")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allBrands")}</SelectItem>
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
              <p>{t("accessories.nessunAccessorioTrovato")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.product")}</TableHead>
                    <TableHead className="hidden lg:table-cell">Barcode</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("common.type")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("products.compatibility")}</TableHead>
                    <TableHead className="text-right">{t("accessories.prezzoB2B")}</TableHead>
                    <TableHead className="text-center">{t("accessories.disponibilit")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map(acc => {
                    const typeInfo = getTypeInfo(acc.specs?.accessoryType);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <TableRow key={acc.id} data-testid={`row-accessory-${acc.id}`}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-3">
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
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">
                        <TableCell>
                          <BarcodeDisplay value={acc.barcode || ""} size="sm" />
                        </TableCell>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {acc.specs?.isUniversal ? (
                              <Badge variant="secondary">{t("products.universal")}</Badge>
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
                              {t("accessories.disponibili", { count: acc.resellerStock })}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {t("accessories.nonDisponibile")}
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
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5" />
              {t("accessories.dettagliAccessorio")}
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
                    <span className="text-sm text-muted-foreground ml-2">{t("accessories.prezzoB2B")}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("accessories.specifiche")}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("accessories.materiale")}</span>
                      <span>{selectedAccessory.specs?.material || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("accessories.colore")}</span>
                      <span>{selectedAccessory.specs?.color || selectedAccessory.color || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("accessories.garanzia")}</span>
                      <span>{selectedAccessory.warrantyMonths ? `${selectedAccessory.warrantyMonths} mesi` : "N/D"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("products.compatibility")}</h4>
                  {selectedAccessory.specs?.isUniversal ? (
                    <Badge variant="secondary">{t("products.universal")}</Badge>
                  ) : selectedAccessory.deviceCompatibilities && selectedAccessory.deviceCompatibilities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedAccessory.deviceCompatibilities.map((comp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {comp.deviceBrand?.name} {comp.deviceModel?.modelName || ""}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">{t("accessories.nonSpecificata")}</span>
                  )}
                </div>
              </div>

              {selectedAccessory.description && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">{t("common.description")}</h4>
                  <p className="text-sm text-muted-foreground">{selectedAccessory.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>{t("common.close")}</Button>
            {selectedAccessory?.availableForPurchase && (
              <Button onClick={() => {
                setDetailDialogOpen(false);
                setBuyQuantity(1);
                setBuyDialogOpen(true);
              }}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("accessories.aggiungiAlCarrello")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accessories.aggiungiAlCarrelloB2B")}</DialogTitle>
            <DialogDescription>
              {t("accessories.aggiungiAccessorioOrdineB2B")}
            </DialogDescription>
          </DialogHeader>
          {selectedAccessory && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedAccessory.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedAccessory.brand} - {getTypeInfo(selectedAccessory.specs?.accessoryType).label}</p>
                <p className="text-lg font-bold mt-2">{formatPrice(selectedAccessory.b2bPrice)}</p>
                <p className="text-sm text-muted-foreground">{t("accessories.disponibili", { count: selectedAccessory.resellerStock })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium">{t("accessories.quantit")}</span>
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
                <span>{t("accessories.totale")}</span>
                <span>{formatPrice(selectedAccessory.b2bPrice * buyQuantity)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>{t("profile.cancel")}</Button>
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
