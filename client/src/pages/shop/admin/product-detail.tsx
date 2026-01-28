import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Package, Smartphone, Headphones, Tag, Users, Settings, Euro, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import type { Product, SmartphoneSpecs, AccessorySpecs, ProductPrice, ProductDeviceCompatibility, ResellerProduct } from "@shared/schema";

interface ProductDetailResponse {
  product: Product;
  specs: SmartphoneSpecs | AccessorySpecs | null;
  compatibilities: Array<ProductDeviceCompatibility & { brandName: string; modelName: string }>;
  prices: Array<ProductPrice & { reseller: { id: string; username: string; fullName: string | null } | null }>;
  assignments: Array<ResellerProduct & { reseller: { id: string; username: string; fullName: string | null } | null }>;
}

const productTypeLabels: Record<string, string> = {
  ricambio: "Ricambio",
  dispositivo: "Smartphone",
  accessorio: "Accessorio",
};

const conditionLabels: Record<string, string> = {
  nuovo: "Nuovo",
  ricondizionato_A: "Ricondizionato A",
  ricondizionato_B: "Ricondizionato B",
  ricondizionato_C: "Ricondizionato C",
  usato: "Usato",
  rotto: "Rotto",
};

const gradeLabels: Record<string, string> = {
  A: "Grado A - Eccellente",
  B: "Grado B - Buono",
  C: "Grado C - Discreto",
  D: "Grado D - Accettabile",
};

const storageLabels: Record<string, string> = {
  "16GB": "16 GB",
  "32GB": "32 GB",
  "64GB": "64 GB",
  "128GB": "128 GB",
  "256GB": "256 GB",
  "512GB": "512 GB",
  "1TB": "1 TB",
  "2TB": "2 TB",
};

const networkLockLabels: Record<string, string> = {
  unlocked: "Sbloccato",
  locked: "Bloccato operatore",
  unknown: "Non verificato",
};

const accessoryTypeLabels: Record<string, string> = {
  cover: "Cover/Custodia",
  screen_protector: "Pellicola/Vetro",
  charger: "Caricatore",
  cable: "Cavo",
  earphones: "Auricolari",
  powerbank: "Powerbank",
  holder: "Supporto",
  other: "Altro",
};

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const { data, isLoading, error } = useQuery<ProductDetailResponse>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="container py-6" data-testid="loading-product-detail">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-6" data-testid="error-product-detail">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-muted-foreground">Prodotto non trovato</p>
            <Link href="/admin/products">
              <Button variant="outline" className="mt-4" data-testid="button-back-products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai prodotti
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { product, specs, compatibilities, prices, assignments } = data;

  const getBackPath = () => {
    switch (product.productType) {
      case "dispositivo":
        return "/admin/dispositivi";
      case "accessorio":
        return "/admin/accessory-catalog";
      default:
        return "/admin/products";
    }
  };

  const getProductIcon = () => {
    switch (product.productType) {
      case "dispositivo":
        return <Smartphone className="h-5 w-5" />;
      case "accessorio":
        return <Headphones className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const formatPrice = (cents: number | null | undefined) => {
    if (cents == null) return "N/D";
    return `€ ${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="container py-6 space-y-6" data-testid="page-product-detail">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={getBackPath()}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            {getProductIcon()}
            <h1 className="text-2xl font-bold" data-testid="text-product-name">{product.name}</h1>
            <Badge variant="secondary" data-testid="badge-product-type">
              {productTypeLabels[product.productType] || product.productType}
            </Badge>
            {product.isVisibleInShop ? (
              <Badge variant="outline" className="gap-1" data-testid="badge-visible">
                <Eye className="h-3 w-3" /> Visibile
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1" data-testid="badge-hidden">
                <EyeOff className="h-3 w-3" /> Nascosto
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1" data-testid="text-sku">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Tag className="h-5 w-5" />
                Informazioni Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium" data-testid="text-category">{product.category || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium" data-testid="text-brand">{product.brand || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condizione</p>
                  <p className="font-medium" data-testid="text-condition">
                    {conditionLabels[product.condition] || product.condition}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Garanzia</p>
                  <p className="font-medium" data-testid="text-warranty">{product.warrantyMonths || 0} mesi</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Colore</p>
                  <p className="font-medium" data-testid="text-color">{product.color || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornitore</p>
                  <p className="font-medium" data-testid="text-supplier">{product.supplier || "N/D"}</p>
                </div>
              </div>
              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrizione</p>
                    <p data-testid="text-description">{product.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="specs" data-testid="tab-specs">Specifiche</TabsTrigger>
              <TabsTrigger value="compatibilities" data-testid="tab-compatibilities">Compatibilità</TabsTrigger>
              <TabsTrigger value="resellers" data-testid="tab-resellers">Rivenditori</TabsTrigger>
            </TabsList>

            <TabsContent value="specs">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Specifiche Tecniche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.productType === "dispositivo" && specs && "storage" in specs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Storage</p>
                        <p className="font-medium" data-testid="text-storage">
                          {storageLabels[specs.storage] || specs.storage}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Grado</p>
                        <p className="font-medium" data-testid="text-grade">
                          {specs.grade ? gradeLabels[specs.grade] || specs.grade : "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Batteria</p>
                        <p className="font-medium" data-testid="text-battery">
                          {specs.batteryHealth ? `${specs.batteryHealth}%` : "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rete</p>
                        <p className="font-medium" data-testid="text-network">
                          {networkLockLabels[specs.networkLock] || specs.networkLock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="font-medium font-mono" data-testid="text-imei">
                          {specs.imei || "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Scatola Originale</p>
                        <p className="font-medium" data-testid="text-box">
                          {specs.originalBox ? "Sì" : "No"}
                        </p>
                      </div>
                      {specs.notes && (
                        <div className="col-span-full">
                          <p className="text-sm text-muted-foreground">Note</p>
                          <p data-testid="text-specs-notes">{specs.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : product.productType === "accessorio" && specs && "accessoryType" in specs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <p className="font-medium" data-testid="text-accessory-type">
                          {accessoryTypeLabels[specs.accessoryType] || specs.accessoryType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Materiale</p>
                        <p className="font-medium" data-testid="text-material">
                          {specs.material || "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Universale</p>
                        <p className="font-medium" data-testid="text-universal">
                          {specs.isUniversal ? "Sì" : "No"}
                        </p>
                      </div>
                      {specs.compatibleBrands && specs.compatibleBrands.length > 0 && (
                        <div className="col-span-full">
                          <p className="text-sm text-muted-foreground mb-1">Marche Compatibili</p>
                          <div className="flex flex-wrap gap-1" data-testid="list-compatible-brands">
                            {specs.compatibleBrands.map((brand, i) => (
                              <Badge key={i} variant="outline">{brand}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {specs.notes && (
                        <div className="col-span-full">
                          <p className="text-sm text-muted-foreground">Note</p>
                          <p data-testid="text-accessory-notes">{specs.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nessuna specifica tecnica disponibile</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compatibilities">
              <Card>
                <CardHeader>
                  <CardTitle>Dispositivi Compatibili</CardTitle>
                </CardHeader>
                <CardContent>
                  {compatibilities.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Marca</TableHead>
                            <TableHead>Modello</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compatibilities.map((c) => (
                            <TableRow key={c.id} data-testid={`row-compatibility-${c.id}`}>
                              <TableCell>{c.brandName}</TableCell>
                              <TableCell>{c.modelName}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground">Nessuna compatibilità configurata</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resellers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Users className="h-5 w-5" />
                    Rivenditori Assegnati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rivenditore</TableHead>
                            <TableHead>Prezzo Vendita</TableHead>
                            <TableHead>Pubblicato</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.map((a) => {
                            const resellerPrice = prices.find((p) => p.resellerId === a.resellerId);
                            return (
                              <TableRow key={a.id} data-testid={`row-assignment-${a.id}`}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{a.reseller?.fullName || a.reseller?.username || "N/D"}</p>
                                    <p className="text-sm text-muted-foreground">@{a.reseller?.username}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {a.customPriceCents != null ? (
                                    <span className="font-medium">{formatPrice(a.customPriceCents)}</span>
                                  ) : resellerPrice ? (
                                    <span className="font-medium">{formatPrice(resellerPrice.priceCents)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">{formatPrice(product.unitPrice)}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {a.isPublished ? (
                                    <Badge variant="default" className="gap-1">
                                      <CheckCircle className="h-3 w-3" /> Sì
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1">
                                      <XCircle className="h-3 w-3" /> No
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground">Nessun rivenditore assegnato</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Euro className="h-5 w-5" />
                Prezzi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prezzo Acquisto</span>
                <span className="font-medium" data-testid="text-cost-price">{formatPrice(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prezzo Vendita</span>
                <span className="font-bold text-lg" data-testid="text-unit-price">{formatPrice(product.unitPrice)}</span>
              </div>
              {product.costPrice && product.unitPrice && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Margine</span>
                    <span className="font-medium text-green-600" data-testid="text-margin">
                      {formatPrice(product.unitPrice - product.costPrice)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Magazzino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Scorta Minima</span>
                <span className="font-medium" data-testid="text-min-stock">{product.minStock || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Posizione</span>
                <span className="font-medium" data-testid="text-location">{product.location || "N/D"}</span>
              </div>
            </CardContent>
          </Card>

          {product.imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Immagine</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full rounded-lg object-cover"
                  data-testid="img-product"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
