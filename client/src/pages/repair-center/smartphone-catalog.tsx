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
import { Smartphone, Search, Battery, HardDrive, ShoppingCart, Eye, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { SmartphoneSpecs, Product } from "@shared/schema";

type SmartphoneWithSpecs = Product & {
  specs: SmartphoneSpecs | null;
  resellerStock: number;
  b2bPrice: number;
  availableForPurchase: boolean;
};

const GRADE_OPTIONS = [
  { value: "A+", label: "A+ - Come nuovo" },
  { value: "A", label: "A - Ottimo" },
  { value: "B", label: "B - Buono" },
  { value: "C", label: "C - Discreto" },
  { value: "D", label: "D - Danneggiato" },
];

// Categorie dispositivi
const DEVICE_CATEGORIES = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "portatile", label: "Portatile" },
  { value: "pc_fisso", label: "PC Fisso" },
  { value: "display", label: "Display" },
  { value: "batteria", label: "Batteria" },
  { value: "accessorio", label: "Accessorio" },
  { value: "altro", label: "Altro" },
];

// Brand per dispositivi mobili
const MOBILE_BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Realme", "Vivo", "Honor", "Nothing", "Asus ROG", "Altro"];

// Brand per PC/Laptop
const PC_BRANDS = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Microsoft", "Razer", "Samsung", "LG", "Toshiba", "Fujitsu", "Altro"];

// Tutti i brand combinati per il filtro
const ALL_BRANDS = Array.from(new Set([...MOBILE_BRANDS, ...PC_BRANDS]));

export default function RepairCenterSmartphoneCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<SmartphoneWithSpecs | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const { toast } = useToast();

  const [cart, setCart] = useState<Array<{ productId: string; quantity: number; name: string; b2bPrice: number }>>(() => {
    const saved = localStorage.getItem('rc-b2b-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: smartphones = [], isLoading } = useQuery<SmartphoneWithSpecs[]>({
    queryKey: ["/api/repair-center/smartphone-catalog"],
  });

  const filteredSmartphones = smartphones.filter(phone => {
    const matchesSearch = !searchQuery || 
      phone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.specs?.imei?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || phone.category === categoryFilter;
    const matchesBrand = brandFilter === "all" || phone.brand === brandFilter;
    const matchesGrade = gradeFilter === "all" || phone.specs?.grade === gradeFilter;
    return matchesSearch && matchesCategory && matchesBrand && matchesGrade;
  });

  const addToCart = (phone: SmartphoneWithSpecs, quantity: number) => {
    const existingIndex = cart.findIndex(item => item.productId === phone.id);
    let newCart;
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, { 
        productId: phone.id, 
        quantity, 
        name: phone.name, 
        b2bPrice: phone.b2bPrice 
      }];
    }
    setCart(newCart);
    localStorage.setItem('rc-b2b-cart', JSON.stringify(newCart));
    toast({
      title: "Aggiunto al carrello",
      description: `${phone.name} x${quantity} aggiunto al carrello B2B`,
    });
    setBuyDialogOpen(false);
  };

  const getGradeColor = (grade: string | undefined) => {
    switch (grade) {
      case "A+": return "bg-green-500";
      case "A": return "bg-green-400";
      case "B": return "bg-yellow-500";
      case "C": return "bg-orange-500";
      case "D": return "bg-red-500";
      default: return "bg-gray-500";
    }
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
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Catalogo Dispositivi</h1>
            <p className="text-muted-foreground">Dispositivi disponibili dal tuo rivenditore</p>
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
                placeholder="Cerca per nome, SKU o IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {DEVICE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-brand-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le marche</SelectItem>
                {ALL_BRANDS.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-grade-filter">
                <SelectValue placeholder="Grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i gradi</SelectItem>
                {GRADE_OPTIONS.map(grade => (
                  <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
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
          ) : filteredSmartphones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun dispositivo trovato</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Specifiche</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead className="text-right">Prezzo B2B</TableHead>
                    <TableHead className="text-center">Disponibilità</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSmartphones.map(phone => (
                    <TableRow key={phone.id} data-testid={`row-smartphone-${phone.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {phone.imageUrl ? (
                            <img 
                              src={phone.imageUrl} 
                              alt={phone.name} 
                              className="h-12 w-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                              <Smartphone className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{phone.name}</div>
                            <div className="text-sm text-muted-foreground">{phone.brand} - {phone.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {phone.category ? (
                          <Badge variant="outline" className="text-xs">
                            {phone.category === 'smartphone' ? 'Smartphone' : 
                             phone.category === 'tablet' ? 'Tablet' :
                             phone.category === 'laptop' ? 'Laptop' :
                             phone.category === 'smartwatch' ? 'Smartwatch' :
                             phone.category === 'console' ? 'Console' :
                             phone.category === 'accessorio' ? 'Accessorio' : phone.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {phone.specs?.storage && (
                            <Badge variant="outline" className="text-xs">
                              <HardDrive className="h-3 w-3 mr-1" />
                              {phone.specs.storage}
                            </Badge>
                          )}
                          {phone.specs?.batteryHealth && (
                            <Badge variant="outline" className="text-xs">
                              <Battery className="h-3 w-3 mr-1" />
                              {phone.specs.batteryHealth}%
                            </Badge>
                          )}
                          {phone.color && (
                            <Badge variant="outline" className="text-xs">
                              {phone.color}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {phone.specs?.grade && (
                          <Badge className={`${getGradeColor(phone.specs.grade)} text-white`}>
                            {phone.specs.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(phone.b2bPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        {phone.availableForPurchase ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Package className="h-3 w-3 mr-1" />
                            {phone.resellerStock} disponibili
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
                              setSelectedPhone(phone);
                              setDetailDialogOpen(true);
                            }}
                            data-testid={`button-view-${phone.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {phone.availableForPurchase && (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedPhone(phone);
                                setBuyQuantity(1);
                                setBuyDialogOpen(true);
                              }}
                              data-testid={`button-add-cart-${phone.id}`}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              <Smartphone className="h-5 w-5" />
              Dettagli Smartphone
            </DialogTitle>
          </DialogHeader>
          {selectedPhone && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedPhone.imageUrl ? (
                  <img 
                    src={selectedPhone.imageUrl} 
                    alt={selectedPhone.name} 
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center">
                    <Smartphone className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedPhone.name}</h3>
                  <p className="text-muted-foreground">{selectedPhone.brand} - SKU: {selectedPhone.sku}</p>
                  <div className="mt-2 flex gap-2">
                    {selectedPhone.specs?.grade && (
                      <Badge className={`${getGradeColor(selectedPhone.specs.grade)} text-white`}>
                        Grado {selectedPhone.specs.grade}
                      </Badge>
                    )}
                    <Badge variant="outline">{selectedPhone.condition || "N/D"}</Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-primary">{formatPrice(selectedPhone.b2bPrice)}</span>
                    <span className="text-sm text-muted-foreground ml-2">Prezzo B2B</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Specifiche Tecniche</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span>{selectedPhone.specs?.storage || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batteria:</span>
                      <span>{selectedPhone.specs?.batteryHealth ? `${selectedPhone.specs.batteryHealth}%` : "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Colore:</span>
                      <span>{selectedPhone.color || "N/D"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blocco rete:</span>
                      <span>{selectedPhone.specs?.networkLock === "unlocked" ? "Sbloccato" : selectedPhone.specs?.networkLock || "N/D"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Identificativi</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IMEI:</span>
                      <span className="font-mono">{selectedPhone.specs?.imei || "N/D"}</span>
                    </div>
                    {selectedPhone.specs?.imei2 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IMEI 2:</span>
                        <span className="font-mono">{selectedPhone.specs.imei2}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">S/N:</span>
                      <span className="font-mono">{selectedPhone.specs?.serialNumber || "N/D"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPhone.description && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Descrizione</h4>
                  <p className="text-sm text-muted-foreground">{selectedPhone.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
            {selectedPhone?.availableForPurchase && (
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
              Aggiungi questo smartphone al tuo ordine B2B
            </DialogDescription>
          </DialogHeader>
          {selectedPhone && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedPhone.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedPhone.brand} - Grado {selectedPhone.specs?.grade}</p>
                <p className="text-lg font-bold mt-2">{formatPrice(selectedPhone.b2bPrice)}</p>
                <p className="text-sm text-muted-foreground">Disponibili: {selectedPhone.resellerStock}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantità:</span>
                <Input 
                  type="number" 
                  value={buyQuantity} 
                  onChange={(e) => setBuyQuantity(Math.max(1, Math.min(selectedPhone.resellerStock, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={selectedPhone.resellerStock}
                  className="w-24"
                  data-testid="input-quantity"
                />
              </div>
              <div className="flex justify-between font-bold">
                <span>Totale:</span>
                <span>{formatPrice(selectedPhone.b2bPrice * buyQuantity)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => selectedPhone && addToCart(selectedPhone, buyQuantity)} data-testid="button-confirm-add">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Aggiungi al Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
