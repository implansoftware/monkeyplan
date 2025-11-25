import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Trash2, Package } from "lucide-react";
import type { Product } from "@shared/schema";

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const partSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Nome ricambio obbligatorio"),
  quantity: z.coerce.number().min(1, "La quantità deve essere almeno 1"),
  unitPrice: z.coerce.number().min(0, "Il prezzo deve essere positivo"),
});

const quoteSchema = z.object({
  parts: z.array(partSchema).optional(),
  laborCost: z.coerce.number().min(0, "Il costo manodopera deve essere positivo").default(0),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export function QuoteFormDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: QuoteFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [totalAmount, setTotalAmount] = useState(0);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      parts: [],
      laborCost: 0,
      validUntil: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  const watchParts = form.watch("parts");
  const watchLaborCost = form.watch("laborCost");

  useEffect(() => {
    const partsTotal = (watchParts || []).reduce((sum, part) => {
      const qty = Number(part.quantity) || 0;
      const price = Number(part.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    const labor = Number(watchLaborCost) || 0;
    setTotalAmount(partsTotal + labor);
  }, [watchParts, watchLaborCost]);

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const partsJson = data.parts && data.parts.length > 0
        ? JSON.stringify(data.parts.map(p => ({
            name: p.name,
            quantity: p.quantity,
            unitPrice: Math.round(p.unitPrice * 100),
          })))
        : null;

      const payload = {
        parts: partsJson,
        laborCost: Math.round((data.laborCost || 0) * 100),
        totalAmount: Math.round(totalAmount * 100),
        validUntil: data.validUntil && data.validUntil.trim() !== '' ? new Date(data.validUntil) : null,
        notes: data.notes && data.notes.trim() !== '' ? data.notes : null,
      };

      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/quote`,
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: "Preventivo creato",
        description: "Il preventivo è stato creato e inviato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/repair-orders/${repairOrderId}`],
      });
      form.reset();
      onOpenChange(false);
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

  const onSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Crea Preventivo
          </DialogTitle>
          <DialogDescription>
            Crea un preventivo con i costi di ricambi e manodopera
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Elenco Ricambi</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: "", name: "", quantity: 1, unitPrice: 0 })}
                    data-testid="button-add-part"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Manuale
                  </Button>
                  <Select
                    onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId);
                      if (product) {
                        append({
                          productId: product.id,
                          name: product.name,
                          quantity: 1,
                          unitPrice: (product.unitPrice || 0) / 100,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="select-product-from-inventory">
                      <Package className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Da Magazzino" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nessun prodotto disponibile
                        </div>
                      ) : (
                        products.filter(p => p.isActive).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {product.sku} - {formatCurrency((product.unitPrice || 0) / 100)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun ricambio aggiunto. Seleziona dal magazzino o aggiungi manualmente.
                  </p>
                ) : (
                  fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-3 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`parts.${index}.name`}
                        render={({ field: nameField }) => (
                          <FormItem className="flex-1">
                            {index === 0 && <FormLabel>Nome Ricambio</FormLabel>}
                            <FormControl>
                              <Input
                                {...nameField}
                                placeholder="es. Schermo LCD"
                                data-testid={`input-part-name-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`parts.${index}.quantity`}
                        render={({ field: qtyField }) => (
                          <FormItem className="w-20">
                            {index === 0 && <FormLabel>Qtà</FormLabel>}
                            <FormControl>
                              <Input
                                {...qtyField}
                                type="number"
                                min="1"
                                data-testid={`input-part-qty-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`parts.${index}.unitPrice`}
                        render={({ field: priceField }) => (
                          <FormItem className="w-28">
                            {index === 0 && <FormLabel>Prezzo Unit.</FormLabel>}
                            <FormControl>
                              <Input
                                {...priceField}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                data-testid={`input-part-price-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        data-testid={`button-remove-part-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manodopera e Totali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Manodopera (EUR)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          data-testid="input-labor-cost"
                        />
                      </FormControl>
                      <FormDescription>
                        Costo totale della manodopera per la riparazione
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Importo Totale:</span>
                  <span data-testid="text-total-amount">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dettagli Aggiuntivi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valido Fino Al</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-valid-until"
                        />
                      </FormControl>
                      <FormDescription>
                        Data di scadenza del preventivo (opzionale)
                      </FormDescription>
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
                        <Textarea
                          {...field}
                          placeholder="Note aggiuntive o condizioni..."
                          rows={3}
                          data-testid="input-quote-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createQuoteMutation.isPending}
                data-testid="button-create-quote"
              >
                {createQuoteMutation.isPending
                  ? "Creazione..."
                  : "Crea Preventivo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
