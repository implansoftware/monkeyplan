import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, Smartphone, Headphones, Wrench, Warehouse, MapPin, 
  Battery, HardDrive, CheckCircle, XCircle, Info, Tag, Users, Settings2
} from "lucide-react";
import { SmartphoneCompatibilityManager } from "./SmartphoneCompatibilityManager";
import { useUser } from "@/hooks/use-user";
import type { Product, SmartphoneSpecs, AccessorySpecs } from "@shared/schema";

type ProductDetails = {
  product: Product;
  specs: SmartphoneSpecs | AccessorySpecs | null;
  compatibilities: Array<{
    id: string;
    brandName: string;
    modelName: string;
  }>;
  prices: Array<{
    id: string;
    priceCents: number;
    costPriceCents: number | null;
    reseller: { id: string; username: string; fullName: string | null } | null;
  }>;
  assignments: Array<{
    id: string;
    reseller: { id: string; username: string; fullName: string | null } | null;
  }>;
  stock: Array<{
    warehouseId: string;
    warehouseName: string;
    ownerType: string;
    quantity: number;
    minStock: number | null;
    location: string | null;
  }>;
};

const CONDITION_LABELS: Record<string, string> = {
  nuovo: "Nuovo",
  ricondizionato: "Ricondizionato",
  usato: "Usato",
  difettoso: "Difettoso",
};

const CATEGORY_LABELS: Record<string, string> = {
  dispositivo: "Dispositivo",
  accessorio: "Accessorio",
  ricambio: "Ricambio",
};

const NETWORK_LABELS: Record<string, string> = {
  unlocked: "Sbloccato",
  locked: "Bloccato operatore",
  icloud_locked: "Bloccato iCloud",
};

const OWNER_TYPE_LABELS: Record<string, string> = {
  admin: "Admin",
  reseller: "Rivenditore",
  sub_reseller: "Sub-Rivenditore",
  repair_center: "Centro Riparazioni",
};

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export function ProductDetailDialog({ open, onOpenChange, productId }: ProductDetailDialogProps) {
  const { user } = useUser();
  const [compatibilityManagerOpen, setCompatibilityManagerOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<ProductDetails>({
    queryKey: ["/api/products", productId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      return res.json();
    },
    enabled: !!productId && open,
  });

  const totalStock = data?.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const canManageCompatibilities = user?.role === "admin" || user?.role === "reseller";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Dettagli Prodotto
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                {data.product.imageUrl ? (
                  <img 
                    src={data.product.imageUrl} 
                    alt={data.product.name}
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border">
                    {data.product.productType === 'dispositivo' ? (
                      <Smartphone className="h-12 w-12 text-muted-foreground" />
                    ) : data.product.productType === 'accessorio' ? (
                      <Headphones className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Wrench className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{data.product.name}</h2>
                  <p className="text-sm text-muted-foreground">SKU: {data.product.sku}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      {CATEGORY_LABELS[data.product.productType || 'ricambio'] || data.product.productType}
                    </Badge>
                    {data.product.condition && (
                      <Badge variant="secondary">
                        {CONDITION_LABELS[data.product.condition] || data.product.condition}
                      </Badge>
                    )}
                    <Badge variant={data.product.isActive ? "default" : "destructive"}>
                      {data.product.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{Number(data.product.unitPrice || 0).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{totalStock} unità</span>
                    </div>
                  </div>
                </div>
              </div>

              {data.product.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrizione</h3>
                  <p className="text-sm">{data.product.description}</p>
                </div>
              )}

              {data.specs && data.product.productType === 'dispositivo' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4" />
                      Specifiche Smartphone
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {data.product.brand && (
                        <div>
                          <span className="text-muted-foreground">Marca:</span>
                          <span className="ml-2 font-medium">{data.product.brand}</span>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).storage && (
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span>{(data.specs as SmartphoneSpecs).storage}</span>
                        </div>
                      )}
                      {data.product.color && (
                        <div>
                          <span className="text-muted-foreground">Colore:</span>
                          <span className="ml-2 font-medium">{data.product.color}</span>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).batteryHealth && (
                        <div className="flex items-center gap-1">
                          <Battery className="h-4 w-4 text-muted-foreground" />
                          <span>{(data.specs as SmartphoneSpecs).batteryHealth}</span>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).grade && (
                        <div>
                          <span className="text-muted-foreground">Grado:</span>
                          <Badge className="ml-2" variant="outline">{(data.specs as SmartphoneSpecs).grade}</Badge>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).networkLock && (
                        <div>
                          <span className="text-muted-foreground">Rete:</span>
                          <span className="ml-2 font-medium">
                            {NETWORK_LABELS[(data.specs as SmartphoneSpecs).networkLock || ''] || (data.specs as SmartphoneSpecs).networkLock}
                          </span>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).imei && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">IMEI:</span>
                          <span className="ml-2 font-mono text-xs">{(data.specs as SmartphoneSpecs).imei}</span>
                        </div>
                      )}
                      {(data.specs as SmartphoneSpecs).originalBox !== undefined && (
                        <div className="flex items-center gap-1">
                          {(data.specs as SmartphoneSpecs).originalBox ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Scatola originale</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {data.specs && data.product.productType === 'accessorio' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Headphones className="h-4 w-4" />
                      Specifiche Accessorio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {data.product.brand && (
                        <div>
                          <span className="text-muted-foreground">Marca:</span>
                          <span className="ml-2 font-medium">{data.product.brand}</span>
                        </div>
                      )}
                      {(data.specs as AccessorySpecs).accessoryType && (
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="ml-2 font-medium">{(data.specs as AccessorySpecs).accessoryType}</span>
                        </div>
                      )}
                      {(data.specs as AccessorySpecs).color || data.product.color ? (
                        <div>
                          <span className="text-muted-foreground">Colore:</span>
                          <span className="ml-2 font-medium">{(data.specs as AccessorySpecs).color || data.product.color}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}

              {data.product.productType === 'ricambio' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Wrench className="h-4 w-4" />
                      Dettagli Ricambio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {data.product.category && (
                        <div>
                          <span className="text-muted-foreground">Categoria:</span>
                          <span className="ml-2 font-medium">{data.product.category}</span>
                        </div>
                      )}
                      {data.product.brand && (
                        <div>
                          <span className="text-muted-foreground">Marca:</span>
                          <span className="ml-2 font-medium">{data.product.brand}</span>
                        </div>
                      )}
                      {data.product.color && (
                        <div>
                          <span className="text-muted-foreground">Colore:</span>
                          <span className="ml-2 font-medium">{data.product.color}</span>
                        </div>
                      )}
                      {data.product.warrantyMonths && (
                        <div>
                          <span className="text-muted-foreground">Garanzia:</span>
                          <span className="ml-2 font-medium">{data.product.warrantyMonths} mesi</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {(data.product.productType === 'accessorio' || data.product.productType === 'ricambio') && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Compatibilità Dispositivi
                      </h3>
                      {canManageCompatibilities && productId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCompatibilityManagerOpen(true)}
                          data-testid="button-manage-compatibilities"
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Gestisci
                        </Button>
                      )}
                    </div>
                    {data.compatibilities && data.compatibilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {data.compatibilities.map((c, i) => (
                          <Badge key={i} variant="secondary">
                            {c.brandName} {c.modelName !== 'Tutti i modelli' ? `- ${c.modelName}` : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nessuna compatibilità definita</p>
                    )}
                  </div>
                </>
              )}

              <Separator />
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <Warehouse className="h-4 w-4" />
                  Stock Magazzino
                </h3>
                {data.stock && data.stock.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Magazzino</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Quantità</TableHead>
                        <TableHead className="text-right">Min. Stock</TableHead>
                        <TableHead>Posizione</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.stock.map((s) => (
                        <TableRow key={s.warehouseId}>
                          <TableCell className="font-medium">{s.warehouseName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {OWNER_TYPE_LABELS[s.ownerType] || s.ownerType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.quantity > 0 ? (s.minStock && s.quantity <= s.minStock ? "destructive" : "default") : "secondary"}>
                              {s.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {s.minStock || "-"}
                          </TableCell>
                          <TableCell className="flex items-center gap-1 text-muted-foreground">
                            {s.location ? (
                              <>
                                <MapPin className="h-3 w-3" />
                                {s.location}
                              </>
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Nessuno stock registrato per questo prodotto.</p>
                )}
              </div>

              {data.prices && data.prices.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      Assegnazioni Rivenditori
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rivenditore</TableHead>
                          <TableHead className="text-right">Prezzo Vendita</TableHead>
                          <TableHead className="text-right">Prezzo Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.prices.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.reseller?.fullName || p.reseller?.username || "-"}</TableCell>
                            <TableCell className="text-right font-medium">{p.priceCents ? `${(Number(p.priceCents) / 100).toFixed(2)} €` : "-"}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {p.costPriceCents ? `${(Number(p.costPriceCents) / 100).toFixed(2)} €` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Prodotto non trovato.</p>
          )}
        </ScrollArea>
      </DialogContent>

      {productId && (
        <SmartphoneCompatibilityManager
          productId={productId}
          open={compatibilityManagerOpen}
          onOpenChange={setCompatibilityManagerOpen}
          onSuccess={() => refetch()}
        />
      )}
    </Dialog>
  );
}
