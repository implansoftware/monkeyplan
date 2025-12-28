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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Plus, Trash2, Package, Calculator, Info, Warehouse } from "lucide-react";
import type { RepairDiagnostics, RepairOrder, RepairCenter, Warehouse as WarehouseType } from "@shared/schema";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WarehouseWithOwner extends WarehouseType {
  owner?: { id: string; username: string; fullName: string | null } | null;
}

interface HourlyRateResponse {
  hourlyRateCents: number;
}

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
  imageUrl: z.string().optional(),
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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [laborCalculation, setLaborCalculation] = useState<{
    hourlyRate: number;
    estimatedHours: number;
    calculatedCost: number;
  } | null>(null);

  const { data: accessibleWarehouses = [] } = useQuery<WarehouseWithOwner[]>({
    queryKey: ["/api/warehouses/accessible"],
    enabled: open,
  });

  // Fetch repair order to get the assigned repair center
  const { data: repairOrder } = useQuery<RepairOrder>({
    queryKey: ["/api/repair-orders", repairOrderId],
    enabled: open && !!repairOrderId,
    retry: false,
  });

  // Fetch repair center to get specific hourly rate
  const { data: repairCenter } = useQuery<RepairCenter>({
    queryKey: ["/api/repair-centers", repairOrder?.repairCenterId],
    enabled: open && !!repairOrder?.repairCenterId,
    retry: false,
  });

  const { 
    data: diagnosis, 
    isError: isDiagnosisError,
    error: diagnosisError 
  } = useQuery<RepairDiagnostics>({
    queryKey: ["/api/repair-orders", repairOrderId, "diagnostics"],
    enabled: open && !!repairOrderId,
    retry: false,
  });

  // Fetch global hourly rate as fallback
  const { 
    data: globalHourlyRateData, 
    isError: isHourlyRateError,
    error: hourlyRateError
  } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/settings/hourly-rate"],
    enabled: open,
    retry: false,
  });

  // Effective hourly rate: repair center rate > global rate
  const effectiveHourlyRateCents = repairCenter?.hourlyRateCents ?? globalHourlyRateData?.hourlyRateCents ?? 3500;
  const hourlyRateSource = repairCenter?.hourlyRateCents ? `Centro: ${repairCenter.name}` : "Tariffa Globale";

  const getErrorStatus = (error: any): number | null => {
    if (!error?.message) return null;
    const match = error.message.match(/^(\d+):/);
    return match ? parseInt(match[1]) : null;
  };

  const diagnosisErrorStatus = isDiagnosisError ? getErrorStatus(diagnosisError) : null;
  const diagnosisNotFound = diagnosisErrorStatus === 404;
  const diagnosisFetchError = isDiagnosisError && !diagnosisNotFound;

  const hourlyRateErrorStatus = isHourlyRateError ? getErrorStatus(hourlyRateError) : null;
  const hourlyRatePermissionError = hourlyRateErrorStatus === 401 || hourlyRateErrorStatus === 403;
  const hourlyRateFetchError = isHourlyRateError && !hourlyRatePermissionError;

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

  useEffect(() => {
    if (open && diagnosis && diagnosis.estimatedRepairTime && effectiveHourlyRateCents) {
      const hourlyRate = effectiveHourlyRateCents / 100;
      const estimatedHours = diagnosis.estimatedRepairTime;
      const calculatedCost = hourlyRate * estimatedHours;
      
      setLaborCalculation({
        hourlyRate,
        estimatedHours,
        calculatedCost,
      });
      
      form.setValue("laborCost", calculatedCost);
    } else if (open) {
      setLaborCalculation(null);
    }
  }, [open, diagnosis, effectiveHourlyRateCents, form]);

  useEffect(() => {
    if (!open) {
      setLaborCalculation(null);
    }
  }, [open]);

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
              <CardHeader className="space-y-3">
                <CardTitle className="text-base">Ricambi e Servizi</CardTitle>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Seleziona prima il magazzino di riferimento per cercare i prodotti disponibili:
                  </p>
                  <div className="flex items-center gap-2">
                    <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                      <SelectTrigger className="w-[220px]" data-testid="select-warehouse">
                        <Warehouse className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Seleziona magazzino" />
                      </SelectTrigger>
                      <SelectContent>
                        {accessibleWarehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                  <SearchableProductCombobox
                    onSelect={(product) => {
                      append({
                        productId: product.id,
                        name: product.name,
                        quantity: 1,
                        unitPrice: (product.unitPrice || 0) / 100,
                        imageUrl: product.imageUrl || undefined,
                      });
                    }}
                    warehouseId={selectedWarehouseId || undefined}
                    productType="ricambio"
                  />
                  <SearchableServiceCombobox
                    onSelect={(service) => {
                      append({
                        productId: "",
                        name: `[Servizio] ${service.name}`,
                        quantity: 1,
                        unitPrice: service.effectivePriceCents / 100,
                      });
                    }}
                    repairCenterId={repairOrder?.repairCenterId || undefined}
                    resellerId={repairOrder?.resellerId || undefined}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun elemento aggiunto. Seleziona dal magazzino, catalogo servizi o aggiungi manualmente.
                  </p>
                ) : (
                  fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-3 items-end"
                    >
                      {/* Product Thumbnail */}
                      <div className={`w-10 h-10 flex-shrink-0 rounded border overflow-hidden ${index === 0 ? 'mt-6' : ''}`}>
                        {field.imageUrl ? (
                          <img 
                            src={field.imageUrl} 
                            alt={field.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
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
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Manodopera e Totali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {laborCalculation && (
                  <Alert className="bg-muted">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Calcolo Automatico:</span>{" "}
                      {formatCurrency(laborCalculation.hourlyRate)}/ora &times; {laborCalculation.estimatedHours} ore = {formatCurrency(laborCalculation.calculatedCost)}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Tariffa: {hourlyRateSource}. Puoi modificare il valore se necessario.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {diagnosisNotFound && (
                  <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="text-sm font-medium">
                        Diagnosi non ancora presente per questa lavorazione. 
                      </span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Inserisci il costo manodopera manualmente o completa prima la diagnosi.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {diagnosisFetchError && (
                  <Alert variant="destructive" className="bg-destructive/10">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="text-sm">
                        Errore nel recupero della diagnosi. Inserisci il costo manodopera manualmente.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {hourlyRatePermissionError && (
                  <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="text-sm">
                        Tariffa oraria non accessibile. Inserisci il costo manodopera manualmente.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {hourlyRateFetchError && (
                  <Alert variant="destructive" className="bg-destructive/10">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="text-sm">
                        Errore nel recupero della tariffa oraria. Inserisci il costo manodopera manualmente.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {!laborCalculation && !isDiagnosisError && !isHourlyRateError && diagnosis && !diagnosis.estimatedRepairTime && (
                  <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="text-sm">
                        Nessun tempo di riparazione stimato nella diagnosi. Inserisci il costo manodopera manualmente.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

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
                        {laborCalculation 
                          ? "Pre-calcolato automaticamente. Puoi modificarlo se necessario."
                          : "Costo totale della manodopera per la riparazione"
                        }
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
