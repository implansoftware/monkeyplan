import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Users, Store, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GlobalProductWithCounts extends Product {
  assignedCount: number;
  publishedCount: number;
}

interface ResellerAssignment {
  reseller: {
    id: string;
    username: string;
    fullName: string | null;
    email: string;
    resellerCategory: string | null;
  };
  assignment: {
    id: string;
    isPublished: boolean;
    customPriceCents: number | null;
  } | null;
  isAssigned: boolean;
  isPublished: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminProductAssignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GlobalProductWithCounts | null>(null);
  const [selectedResellers, setSelectedResellers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: globalProducts, isLoading } = useQuery<GlobalProductWithCounts[]>({
    queryKey: ['/api/admin/global-products'],
  });

  const { data: resellerAssignments, isLoading: isLoadingAssignments } = useQuery<ResellerAssignment[]>({
    queryKey: ['/api/admin/products', selectedProduct?.id, 'reseller-assignments'],
    enabled: !!selectedProduct,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ productId, resellerIds }: { productId: string; resellerIds: string[] }) => {
      const res = await apiRequest('POST', `/api/admin/products/${productId}/assign`, { resellerIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Successo", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', selectedProduct?.id, 'reseller-assignments'] });
      setSelectedResellers(new Set());
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ productId, resellerId }: { productId: string; resellerId: string }) => {
      await apiRequest('DELETE', `/api/admin/products/${productId}/assign/${resellerId}`);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Assegnazione rimossa" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', selectedProduct?.id, 'reseller-assignments'] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = globalProducts?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleOpenAssignDialog = (product: GlobalProductWithCounts) => {
    setSelectedProduct(product);
    setSelectedResellers(new Set());
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedProduct || selectedResellers.size === 0) return;
    assignMutation.mutate({
      productId: selectedProduct.id,
      resellerIds: Array.from(selectedResellers),
    });
  };

  const toggleReseller = (resellerId: string) => {
    const newSet = new Set(selectedResellers);
    if (newSet.has(resellerId)) {
      newSet.delete(resellerId);
    } else {
      newSet.add(resellerId);
    }
    setSelectedResellers(newSet);
  };

  const unassignedResellers = resellerAssignments?.filter(r => !r.isAssigned) || [];
  const assignedResellers = resellerAssignments?.filter(r => r.isAssigned) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Store className="h-8 w-8" />
            Assegnazione Prodotti
          </h1>
          <p className="text-muted-foreground">Assegna i prodotti globali ai reseller per la vendita nei loro shop</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Prodotti Globali</CardTitle>
              <CardDescription>Prodotti creati dall'admin disponibili per l'assegnazione</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nessun prodotto globale</h3>
              <p className="text-muted-foreground">Crea prodotti dalla sezione Prodotti per poterli assegnare ai reseller</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prezzo Base</TableHead>
                  <TableHead className="text-center">Assegnati</TableHead>
                  <TableHead className="text-center">Pubblicati</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(product.unitPrice)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.assignedCount > 0 ? "default" : "secondary"}>
                        <Users className="h-3 w-3 mr-1" />
                        {product.assignedCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.publishedCount > 0 ? "default" : "secondary"}>
                        <Store className="h-3 w-3 mr-1" />
                        {product.publishedCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAssignDialog(product)}
                        data-testid={`button-assign-${product.id}`}
                      >
                        <Users className="h-4 w-4 mr-2" />
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestisci Assegnazioni</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Seleziona i reseller a cui assegnare questo prodotto
            </DialogDescription>
          </DialogHeader>

          {isLoadingAssignments ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {assignedResellers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Già assegnati ({assignedResellers.length})
                  </h4>
                  <ScrollArea className="h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                      {assignedResellers.map((item) => (
                        <div
                          key={item.reseller.id}
                          className="flex items-center justify-between p-2 rounded hover-elevate"
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{item.reseller.fullName || item.reseller.username}</p>
                              <p className="text-sm text-muted-foreground">{item.reseller.email}</p>
                            </div>
                            {item.isPublished && (
                              <Badge variant="default" className="ml-2">
                                <Store className="h-3 w-3 mr-1" />
                                Pubblicato
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => selectedProduct && unassignMutation.mutate({
                              productId: selectedProduct.id,
                              resellerId: item.reseller.id,
                            })}
                            disabled={unassignMutation.isPending}
                            data-testid={`button-unassign-${item.reseller.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {unassignedResellers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Reseller disponibili ({unassignedResellers.length})</h4>
                  <ScrollArea className="h-48 border rounded-md">
                    <div className="p-2 space-y-1">
                      {unassignedResellers.map((item) => (
                        <div
                          key={item.reseller.id}
                          className="flex items-center gap-3 p-2 rounded hover-elevate cursor-pointer"
                          onClick={() => toggleReseller(item.reseller.id)}
                        >
                          <Checkbox
                            checked={selectedResellers.has(item.reseller.id)}
                            onCheckedChange={() => toggleReseller(item.reseller.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.reseller.fullName || item.reseller.username}</p>
                            <p className="text-sm text-muted-foreground">{item.reseller.email}</p>
                          </div>
                          {item.reseller.resellerCategory && (
                            <Badge variant="outline">{item.reseller.resellerCategory}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {unassignedResellers.length === 0 && assignedResellers.length > 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Tutti i reseller hanno già questo prodotto assegnato
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Chiudi
            </Button>
            {selectedResellers.size > 0 && (
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                data-testid="button-confirm-assign"
              >
                Assegna a {selectedResellers.size} reseller
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
