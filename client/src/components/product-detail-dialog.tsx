import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Smartphone, Headphones, Wrench, Warehouse, MapPin, 
  Battery, HardDrive, CheckCircle, XCircle, Info, Tag, Users, Link2
} from "lucide-react";
import type { Product, SmartphoneSpecs, AccessorySpecs } from "@shared/schema";
import { 
  DEVICE_CATEGORY_LABELS, 
  PRODUCT_TYPE_LABELS, 
  getSpecsConfig 
} from "@/lib/device-category-config";

type ProductDetails = {
  product: Product;
  specs: SmartphoneSpecs | AccessorySpecs | null;
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
  compatibilities?: Array<{
    id: string;
    deviceBrandId: string;
    deviceBrandName: string | null;
    deviceModelId: string | null;
    deviceModelName: string | null;
  }>;
};

function getConditionLabels(t: (key: string) => string): Record<string, string> {
  return {
    nuovo: t("common.new"),
    ricondizionato: "Ricondizionato",
    usato: "Usato",
    difettoso: "Difettoso",
  };
}

function getNetworkLabels(t: (key: string) => string): Record<string, string> {
  return {
    unlocked: t("products.unlocked"),
    locked: t("products.carrierLocked"),
    icloud_locked: t("products.icloudLocked"),
  };
}

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
  hideStock?: boolean;
  hidePrices?: boolean;
  overridePrice?: number | null;
}

export function ProductDetailDialog({ open, onOpenChange, productId, hideStock = false, hidePrices = false, overridePrice }: ProductDetailDialogProps) {
  const { t } = useTranslation();
  const CONDITION_LABELS = getConditionLabels(t);
  const NETWORK_LABELS = getNetworkLabels(t);
  const { data, isLoading } = useQuery<ProductDetails>({
    queryKey: ["/api/products", productId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      return res.json();
    },
    enabled: !!productId && open,
  });

  const totalStock = data?.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
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
                      {data.product.productType === 'dispositivo' && data.product.category
                        ? DEVICE_CATEGORY_LABELS[data.product.category] || data.product.category
                        : PRODUCT_TYPE_LABELS[data.product.productType || 'ricambio'] || data.product.productType}
                    </Badge>
                    {data.product.condition && (
                      <Badge variant="secondary">
                        {CONDITION_LABELS[data.product.condition] || data.product.condition}
                      </Badge>
                    )}
                    <Badge variant={data.product.isActive ? "default" : "destructive"}>
                      {data.product.isActive ? t("common.active") : "Inattivo"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{(Number(overridePrice ?? data.product.unitPrice ?? 0) / 100).toFixed(2)} €</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{totalStock} unità</span>
                    </div>
                  </div>
                </div>
              </div>

              {data.product.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("common.description")}</h3>
                  <p className="text-sm">{data.product.description}</p>
                </div>
              )}

              {data.product.productType === 'dispositivo' && (() => {
                const specsConfig = getSpecsConfig(data.product.category);
                const specs = data.specs as SmartphoneSpecs | null;
                return (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <Smartphone className="h-4 w-4" />
                        Specifiche {DEVICE_CATEGORY_LABELS[data.product.category || ''] || t('products.device')}
                      </h3>
                      {specs ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {data.product.brand && (
                            <div>
                              <span className="text-muted-foreground">Marca:</span>
                              <span className="ml-2 font-medium">{data.product.brand}</span>
                            </div>
                          )}
                          {specsConfig.storage && specs.storage && (
                            <div className="flex flex-wrap items-center gap-1">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span>{specs.storage}</span>
                            </div>
                          )}
                          {data.product.color && (
                            <div>
                              <span className="text-muted-foreground">Colore:</span>
                              <span className="ml-2 font-medium">{data.product.color}</span>
                            </div>
                          )}
                          {specsConfig.batteryHealth && specs.batteryHealth && (
                            <div className="flex flex-wrap items-center gap-1">
                              <Battery className="h-4 w-4 text-muted-foreground" />
                              <span>{specs.batteryHealth}%</span>
                            </div>
                          )}
                          {specsConfig.grade && specs.grade && (
                            <div>
                              <span className="text-muted-foreground">Grado:</span>
                              <Badge className="ml-2" variant="outline">{specs.grade}</Badge>
                            </div>
                          )}
                          {specsConfig.networkLock && specs.networkLock && (
                            <div>
                              <span className="text-muted-foreground">Rete:</span>
                              <span className="ml-2 font-medium">
                                {NETWORK_LABELS[specs.networkLock || ''] || specs.networkLock}
                              </span>
                            </div>
                          )}
                          {specsConfig.imei && specs.imei && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">IMEI:</span>
                              <span className="ml-2 font-mono text-xs">{specs.imei}</span>
                            </div>
                          )}
                          {specsConfig.serialNumber && specs.serialNumber && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Numero Seriale:</span>
                              <span className="ml-2 font-mono text-xs">{specs.serialNumber}</span>
                            </div>
                          )}
                          {specsConfig.originalBox && specs.originalBox !== undefined && (
                            <div className="flex flex-wrap items-center gap-1">
                              {specs.originalBox ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>Scatola originale</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          Nessuna specifica tecnica disponibile. Modifica il dispositivo per aggiungere le specifiche.
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {data.specs && data.product.productType === 'accessorio' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Headphones className="h-4 w-4" />
                      Specifiche Accessorio
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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

              {!hideStock && (
                <>
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
                            <TableHead>{t("warehouse.warehouse")}</TableHead>
                            <TableHead>{t("common.type")}</TableHead>
                            <TableHead className="text-right">{t("common.quantity")}</TableHead>
                            <TableHead className="text-right">Min. Stock</TableHead>
                            <TableHead>{t("warehouse.position")}</TableHead>
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
                              <TableCell className="flex flex-wrap items-center gap-1 text-muted-foreground">
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
                </>
              )}

              {data.compatibilities && data.compatibilities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Link2 className="h-4 w-4" />
                      {t("products.deviceCompatibility")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.compatibilities.map((c) => {
                        const label = c.deviceModelName 
                          ? `${c.deviceBrandName || ''} ${c.deviceModelName}`
                          : t("products.brandAllModels", { brand: c.deviceBrandName || t("common.brand") });
                        return (
                          <Badge key={c.id} variant="secondary">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!hidePrices && data.prices && data.prices.length > 0 && (
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
                          <TableHead>{t("staff.reseller")}</TableHead>
                          <TableHead className="text-right">{t("products.salePrice")}</TableHead>
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
    </Dialog>
  );
}
