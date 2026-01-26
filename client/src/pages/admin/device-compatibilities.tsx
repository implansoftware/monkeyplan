import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, Search, Plus, Trash2, Package, Smartphone, Check, X, Filter } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, DeviceBrand, DeviceModel, DeviceType } from "@shared/schema";

interface ProductCompatibility {
  productId: string;
  productName: string;
  productCategory: string;
  compatibilities: Array<{
    brandId: string;
    brandName: string;
    modelId: string | null;
    modelName: string | null;
  }>;
}

interface CompatibilityEntry {
  deviceBrandId: string;
  deviceModelId: string | null;
}

export default function DeviceCompatibilities() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompatibilities, setSelectedCompatibilities] = useState<CompatibilityEntry[]>([]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  const { data: compatibilityCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/products/compatibilities-count"],
  });

  const { data: productCompatibilities, isLoading: compatLoading } = useQuery<ProductCompatibility | null>({
    queryKey: ["/api/products", selectedProduct?.id, "compatibilities"],
    queryFn: async () => {
      if (!selectedProduct) return null;
      const res = await fetch(`/api/products/${selectedProduct.id}/compatibilities`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCategory: selectedProduct.category || "ricambio",
        compatibilities: data,
      };
    },
    enabled: !!selectedProduct,
  });

  const updateCompatibilities = useMutation({
    mutationFn: async ({ productId, compatibilities }: { productId: string; compatibilities: CompatibilityEntry[] }) => {
      return await apiRequest("PUT", `/api/products/${productId}/compatibilities`, { compatibilities });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/compatibilities-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProduct?.id, "compatibilities"] });
      toast({ title: "Compatibilità aggiornate", description: "Le compatibilità sono state salvate con successo." });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (productCompatibilities?.compatibilities) {
      const entries: CompatibilityEntry[] = productCompatibilities.compatibilities.map((c) => ({
        deviceBrandId: c.brandId,
        deviceModelId: c.modelId || null,
      }));
      setSelectedCompatibilities(entries);
    }
  }, [productCompatibilities]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const openEditDialog = async (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleSaveCompatibilities = () => {
    if (!selectedProduct) return;
    updateCompatibilities.mutate({
      productId: selectedProduct.id,
      compatibilities: selectedCompatibilities,
    });
  };

  const toggleBrandCompatibility = (brandId: string) => {
    const exists = selectedCompatibilities.some((c) => c.deviceBrandId === brandId && c.deviceModelId === null);
    if (exists) {
      setSelectedCompatibilities((prev) => prev.filter((c) => !(c.deviceBrandId === brandId && c.deviceModelId === null)));
    } else {
      setSelectedCompatibilities((prev) => [...prev, { deviceBrandId: brandId, deviceModelId: null }]);
    }
  };

  const toggleModelCompatibility = (brandId: string, modelId: string) => {
    const exists = selectedCompatibilities.some((c) => c.deviceBrandId === brandId && c.deviceModelId === modelId);
    if (exists) {
      setSelectedCompatibilities((prev) => prev.filter((c) => !(c.deviceBrandId === brandId && c.deviceModelId === modelId)));
    } else {
      setSelectedCompatibilities((prev) => [...prev, { deviceBrandId: brandId, deviceModelId: modelId }]);
    }
  };

  const isModelSelected = (brandId: string, modelId: string) => {
    return selectedCompatibilities.some((c) => c.deviceBrandId === brandId && c.deviceModelId === modelId);
  };

  const isBrandSelected = (brandId: string) => {
    return selectedCompatibilities.some((c) => c.deviceBrandId === brandId && c.deviceModelId === null);
  };


  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ricambio: "Ricambio",
      accessorio: "Accessorio",
      smartphone: "Smartphone",
      tablet: "Tablet",
      laptop: "Laptop",
      smartwatch: "Smartwatch",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-compatibilities-title">
                Compatibilità Dispositivi
              </h1>
              <p className="text-white/80 text-sm">Gestisci le compatibilità tra prodotti e dispositivi</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Prodotti e Compatibilità</CardTitle>
              <CardDescription>
                Seleziona un prodotto per gestire i dispositivi compatibili
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotto per nome o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>
                    {getCategoryLabel(cat!)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productsLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun prodotto trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Compatibilità</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{product.sku || "-"}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(product.category || "ricambio")}</Badge>
                    </TableCell>
                    <TableCell>
                      {compatibilityCounts[product.id] ? (
                        <Badge variant="default">
                          <Smartphone className="h-3 w-3 mr-1" />
                          {compatibilityCounts[product.id]} dispositivi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Nessuna
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                        data-testid={`button-edit-compat-${product.id}`}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Gestisci
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedProduct(null);
          setSelectedCompatibilities([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Compatibilità: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Seleziona i brand e modelli di dispositivo compatibili con questo prodotto
            </DialogDescription>
          </DialogHeader>

          {compatLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {deviceBrands.filter(b => b.isActive !== false).map((brand) => {
                  const brandModels = deviceModels.filter((m) => m.brandId === brand.id && m.isActive !== false);
                  const brandSelected = isBrandSelected(brand.id);

                  return (
                    <div key={brand.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          checked={brandSelected}
                          onCheckedChange={() => toggleBrandCompatibility(brand.id)}
                          data-testid={`checkbox-brand-${brand.id}`}
                        />
                        <span className="font-semibold">{brand.name}</span>
                        {brandSelected && (
                          <Badge variant="default" className="text-xs">
                            Tutti i modelli
                          </Badge>
                        )}
                      </div>

                      {!brandSelected && brandModels.length > 0 && (
                        <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {brandModels.map((model) => (
                            <div key={model.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={isModelSelected(brand.id, model.id)}
                                onCheckedChange={() => toggleModelCompatibility(brand.id, model.id)}
                                data-testid={`checkbox-model-${model.id}`}
                              />
                              <span className="text-sm">{model.modelName}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!brandSelected && brandModels.length === 0 && (
                        <p className="ml-6 text-sm text-muted-foreground">
                          Nessun modello disponibile per questo brand
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedCompatibilities.length} compatibilità selezionate
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleSaveCompatibilities}
                disabled={updateCompatibilities.isPending}
              >
                {updateCompatibilities.isPending ? "Salvataggio..." : "Salva compatibilità"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
