import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  unitPrice: number;
  createdAt: string;
};

type InventoryWithDetails = {
  id: string;
  productId: string;
  repairCenterId: string;
  quantity: number;
  updatedAt: string;
  product?: Product;
};

export default function RepairCenterInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: inventory = [], isLoading } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/repair-center/inventory"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      movementType: string;
      quantity: number;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/repair-center/inventory/movements", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/stats"] });
      setDialogOpen(false);
      toast({ title: "Movimento registrato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productId = formData.get("productId") as string;
    const movementType = formData.get("movementType") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const notes = formData.get("notes") as string || undefined;

    if (!productId || !movementType || !quantity) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }

    createMovementMutation.mutate({ productId, movementType, quantity, notes });
  };

  const filteredInventory = inventory.filter((item) => {
    if (!item.product) return false;
    return item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getLowStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Esaurito</Badge>;
    if (quantity < 5) return <Badge variant="secondary">Scorte basse</Badge>;
    return null;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Magazzino Centro</h1>
          <p className="text-muted-foreground">
            Gestisci lo stock e i movimenti del tuo centro riparazione
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-movement">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Movimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registra Movimento Inventario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Prodotto *</Label>
                <Select name="productId" required>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Seleziona prodotto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movementType">Tipo Movimento *</Label>
                <Select name="movementType" required>
                  <SelectTrigger data-testid="select-movement-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Carico (IN)</SelectItem>
                    <SelectItem value="OUT">Scarico (OUT)</SelectItem>
                    <SelectItem value="TRANSFER">Trasferimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantità *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  placeholder="Es. 10"
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Note aggiuntive (opzionale)"
                  data-testid="textarea-notes"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMovementMutation.isPending} data-testid="button-submit-movement">
                {createMovementMutation.isPending ? "Registrazione..." : "Registra Movimento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome prodotto o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Prodotti ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun prodotto in stock
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nome Prodotto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantità</TableHead>
                  <TableHead>Prezzo Unitario</TableHead>
                  <TableHead>Valore Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-mono" data-testid={`text-sku-${item.product?.sku}`}>
                      {item.product?.sku}
                    </TableCell>
                    <TableCell className="font-medium">{item.product?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.product?.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        {getLowStockBadge(item.quantity)}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.product?.unitPrice || 0)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency((item.product?.unitPrice || 0) * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
