import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Truck, CheckCircle, Clock, Search, Warehouse } from "lucide-react";
import type { PartsOrder, Product } from "@shared/schema";

interface PartsOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const partsOrderSchema = z.object({
  productId: z.string().optional(),
  partName: z.string().min(1, "Il nome del ricambio è obbligatorio"),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().min(1, "La quantità deve essere almeno 1"),
  unitCost: z.coerce.number().min(0, "Il costo deve essere positivo"),
  supplier: z.string().optional(),
  expectedArrival: z.string().optional(),
  notes: z.string().optional(),
});

type PartsOrderFormData = z.infer<typeof partsOrderSchema>;

export function PartsOrderDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: PartsOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: existingParts = [] } = useQuery<PartsOrder[]>({
    queryKey: ["/api/repair-orders", repairOrderId, "parts"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/parts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch parts");
      return res.json();
    },
    enabled: open,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<PartsOrderFormData>({
    resolver: zodResolver(partsOrderSchema),
    defaultValues: {
      productId: "",
      partName: "",
      partNumber: "",
      quantity: 1,
      unitCost: 0,
      supplier: "",
      expectedArrival: "",
      notes: "",
    },
  });

  const selectProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue("productId", product.id);
      form.setValue("partName", product.name);
      form.setValue("partNumber", product.sku);
      form.setValue("unitCost", product.unitPrice / 100);
    }
  };

  const createPartMutation = useMutation({
    mutationFn: async (data: PartsOrderFormData) => {
      const payload = {
        productId: data.productId || null,
        partName: data.partName,
        partNumber: data.partNumber || null,
        quantity: data.quantity,
        unitCost: Math.round(data.unitCost * 100),
        supplier: data.supplier || null,
        expectedArrival: data.expectedArrival || null,
        notes: data.notes || null,
      };
      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/parts`,
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: "Ricambio ordinato",
        description: "L'ordine del ricambio è stato creato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      form.reset();
      setSearchTerm("");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/parts-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Stato aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: PartsOrderFormData) => {
    createPartMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ordered":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Ordinato</Badge>;
      case "in_transit":
        return <Badge variant="secondary"><Truck className="h-3 w-3 mr-1" />In Transito</Badge>;
      case "received":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Ricevuto</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestione Ricambi
          </DialogTitle>
          <DialogDescription>
            Ordina e traccia i ricambi per questa riparazione
          </DialogDescription>
        </DialogHeader>

        {existingParts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordini Ricambi Esistenti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {existingParts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`part-order-${part.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{part.partName}</span>
                      {part.productId && (
                        <Badge variant="outline" className="text-xs">
                          <Warehouse className="h-3 w-3 mr-1" />
                          Da magazzino
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {part.partNumber && <span>#{part.partNumber} - </span>}
                      Qtà: {part.quantity} - {formatCurrency(part.unitCost)}
                      {part.supplier && <span> - {part.supplier}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(part.status)}
                    {part.status === "ordered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: part.id, status: "in_transit" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-transit-${part.id}`}
                      >
                        <Truck className="h-3 w-3" />
                      </Button>
                    )}
                    {part.status === "in_transit" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: part.id, status: "received" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-receive-${part.id}`}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Ordina Nuovo Ricambio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca prodotto per nome o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-product"
                />
              </div>

              {searchTerm && filteredProducts.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover-elevate cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        selectProduct(product.id);
                        setSearchTerm("");
                      }}
                      data-testid={`product-option-${product.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku} | {product.category}
                          </div>
                        </div>
                        <div className="font-medium text-primary">
                          {formatCurrency(product.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {productsLoading && (
                <div className="text-center text-muted-foreground py-4">
                  Caricamento prodotti...
                </div>
              )}

              {!productsLoading && searchTerm && filteredProducts.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Nessun prodotto trovato nel catalogo.
                </div>
              )}

              {form.watch("productId") && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Prodotto selezionato:</div>
                  <div className="font-medium">{form.watch("partName")}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {form.watch("partNumber")} | {formatCurrency((form.watch("unitCost") || 0) * 100)}
                  </div>
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantità *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" data-testid="input-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Unitario (EUR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" data-testid="input-unit-cost" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expectedArrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Arrivo Prevista</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-expected-arrival" />
                      </FormControl>
                      <FormDescription>Quando è previsto l'arrivo del ricambio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Note aggiuntive..." rows={2} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-close"
                  >
                    Chiudi
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPartMutation.isPending || !form.watch("partName")}
                    data-testid="button-order-part"
                  >
                    {createPartMutation.isPending ? "Ordinando..." : "Ordina Ricambio"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
