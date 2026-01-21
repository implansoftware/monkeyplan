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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Package, 
  Calculator, 
  Info, 
  Warehouse,
  PenLine,
  Search,
  Wrench,
  Globe,
  ShoppingCart,
  Euro,
  Calendar,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { RepairDiagnostics, RepairOrder, RepairCenter, Warehouse as WarehouseType } from "@shared/schema";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { NetworkProductSearch } from "@/components/NetworkProductSearch";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WarehouseWithOwner extends WarehouseType {
  owner?: { id: string; username: string; fullName: string | null } | null;
}

interface HourlyRateResponse {
  hourlyRateCents: number;
}

export interface QuoteCollectedData {
  parts: Array<{ name: string; quantity: number; unitPrice: number }>;
  laborCost: number;
  notes?: string;
}

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId?: string;
  onSuccess?: () => void;
  standalone?: boolean;
  onDataCollected?: (data: QuoteCollectedData) => void;
}

const partSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Nome ricambio obbligatorio"),
  quantity: z.coerce.number().min(1, "La quantità deve essere almeno 1"),
  unitPrice: z.coerce.number().min(0, "Il prezzo deve essere positivo"),
  imageUrl: z.string().optional(),
  source: z.string().optional(),
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
  standalone = false,
  onDataCollected,
}: QuoteFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [wantAddLaborCost, setWantAddLaborCost] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [laborCalculation, setLaborCalculation] = useState<{
    hourlyRate: number;
    estimatedHours: number;
    calculatedCost: number;
  } | null>(null);

  const { data: accessibleWarehouses = [] } = useQuery<WarehouseWithOwner[]>({
    queryKey: ["/api/warehouses/accessible"],
    enabled: open,
  });

  const { data: repairOrder } = useQuery<RepairOrder>({
    queryKey: ["/api/repair-orders", repairOrderId],
    enabled: open && !!repairOrderId && !standalone,
    retry: false,
  });

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
    enabled: open && !!repairOrderId && !standalone,
    retry: false,
  });

  const { 
    data: globalHourlyRateData, 
    isError: isHourlyRateError,
    error: hourlyRateError
  } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/settings/hourly-rate"],
    enabled: open,
    retry: false,
  });

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
      setShowAdvanced(false);
      setSelectedWarehouseId("");
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
      setWantAddLaborCost(false);
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
    if (standalone && onDataCollected) {
      const collectedData: QuoteCollectedData = {
        parts: (data.parts || []).map(p => ({
          name: p.name,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
        laborCost: data.laborCost || 0,
        notes: data.notes,
      };
      onDataCollected(collectedData);
      form.reset();
      setSelectedWarehouseId("");
      setWantAddLaborCost(false);
      onOpenChange(false);
      return;
    }
    
    createQuoteMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "warehouse":
        return <Badge variant="outline" className="text-xs"><Warehouse className="h-3 w-3 mr-1" />Magazzino</Badge>;
      case "service":
        return <Badge variant="outline" className="text-xs"><Wrench className="h-3 w-3 mr-1" />Servizio</Badge>;
      case "network":
        return <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Rete</Badge>;
      case "supplier":
        return <Badge variant="outline" className="text-xs"><ShoppingCart className="h-3 w-3 mr-1" />Fornitore</Badge>;
      default:
        return <Badge variant="outline" className="text-xs"><PenLine className="h-3 w-3 mr-1" />Manuale</Badge>;
    }
  };

  const partsTotal = (watchParts || []).reduce((sum, part) => {
    const qty = Number(part.quantity) || 0;
    const price = Number(part.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Crea Preventivo</DialogTitle>
              <DialogDescription className="text-sm">
                Aggiungi ricambi e servizi per creare il preventivo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Aggiungi Articoli
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scegli come vuoi aggiungere ricambi e servizi al preventivo
                  </p>
                </div>
                
                <Tabs defaultValue="warehouse" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 p-1 m-2 mr-4">
                    <TabsTrigger value="warehouse" className="text-xs gap-1" data-testid="tab-warehouse">
                      <Warehouse className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Magazzino</span>
                    </TabsTrigger>
                    <TabsTrigger value="services" className="text-xs gap-1" data-testid="tab-services">
                      <Wrench className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Servizi</span>
                    </TabsTrigger>
                    <TabsTrigger value="network" className="text-xs gap-1" data-testid="tab-network">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Rete</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs gap-1" data-testid="tab-manual">
                      <PenLine className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Manuale</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4 pt-2">
                    <TabsContent value="warehouse" className="mt-0 space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Cerca ricambi disponibili nel tuo magazzino
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                          <SelectTrigger className="w-full" data-testid="select-warehouse">
                            <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Seleziona un magazzino..." />
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
                      {selectedWarehouseId && (
                        <SearchableProductCombobox
                          onSelect={(product) => {
                            append({
                              productId: product.id,
                              name: product.name,
                              quantity: 1,
                              unitPrice: (product.unitPrice || 0) / 100,
                              imageUrl: product.imageUrl || undefined,
                              source: "warehouse",
                            });
                          }}
                          warehouseId={selectedWarehouseId}
                          productType="ricambio"
                        />
                      )}
                      {!selectedWarehouseId && (
                        <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg border-dashed">
                          <Warehouse className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Seleziona prima un magazzino per cercare i ricambi
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="services" className="mt-0 space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Aggiungi servizi dal catalogo (sostituzione schermo, riparazione, ecc.)
                      </div>
                      <SearchableServiceCombobox
                        onSelect={(service) => {
                          append({
                            productId: "",
                            name: service.name,
                            quantity: 1,
                            unitPrice: service.effectivePriceCents / 100,
                            source: "service",
                          });
                        }}
                        repairCenterId={repairOrder?.repairCenterId || undefined}
                        resellerId={repairOrder?.resellerId || undefined}
                        deviceTypeId={(repairOrder as any)?.deviceTypeId || undefined}
                        brandId={(repairOrder as any)?.deviceBrandId || undefined}
                        modelId={repairOrder?.deviceModelId || undefined}
                      />
                    </TabsContent>

                    <TabsContent value="network" className="mt-0 space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Cerca prodotti nella rete (altri magazzini, marketplace, fornitori)
                      </div>
                      <NetworkProductSearch
                        onSelect={(product) => {
                          append({
                            productId: product.id,
                            name: product.source === "supplier" 
                              ? `[${product.supplierName}] ${product.name}` 
                              : `[${product.ownerName}] ${product.name}`,
                            quantity: 1,
                            unitPrice: product.unitPrice / 100,
                            imageUrl: product.imageUrl,
                            source: product.source === "supplier" ? "supplier" : "network",
                          });
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="manual" className="mt-0 space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Inserisci manualmente un articolo con nome e prezzo personalizzati
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => append({ productId: "", name: "", quantity: 1, unitPrice: 0, source: "manual" })}
                        data-testid="button-add-part"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Voce Manuale
                      </Button>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {fields.length > 0 && (
                <div className="rounded-lg border bg-card">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      Articoli nel Preventivo
                      <Badge variant="secondary" className="ml-1">{fields.length}</Badge>
                    </h3>
                    <div className="text-sm font-medium">
                      Subtotale: {formatCurrency(partsTotal)}
                    </div>
                  </div>
                  <div className="divide-y">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3 flex gap-3 items-start hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg border overflow-hidden bg-muted">
                          {field.imageUrl ? (
                            <img 
                              src={field.imageUrl} 
                              alt={field.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <FormField
                                control={form.control}
                                name={`parts.${index}.name`}
                                render={({ field: nameField }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        {...nameField}
                                        placeholder="Nome articolo"
                                        className="h-8 text-sm font-medium"
                                        data-testid={`input-part-name-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => remove(index)}
                              data-testid={`button-remove-part-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getSourceBadge(field.source)}
                            <div className="flex items-center gap-2 ml-auto">
                              <FormField
                                control={form.control}
                                name={`parts.${index}.quantity`}
                                render={({ field: qtyField }) => (
                                  <FormItem className="space-y-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">Qtà:</span>
                                      <FormControl>
                                        <Input
                                          {...qtyField}
                                          type="number"
                                          min="1"
                                          className="h-7 w-14 text-center text-sm"
                                          data-testid={`input-part-qty-${index}`}
                                        />
                                      </FormControl>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              <span className="text-muted-foreground">×</span>
                              <FormField
                                control={form.control}
                                name={`parts.${index}.unitPrice`}
                                render={({ field: priceField }) => (
                                  <FormItem className="space-y-0">
                                    <div className="flex items-center gap-1">
                                      <FormControl>
                                        <Input
                                          {...priceField}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="h-7 w-20 text-right text-sm"
                                          data-testid={`input-part-price-${index}`}
                                        />
                                      </FormControl>
                                      <Euro className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </FormItem>
                                )}
                              />
                              <span className="text-sm font-medium min-w-[70px] text-right">
                                = {formatCurrency((Number(watchParts?.[index]?.quantity) || 0) * (Number(watchParts?.[index]?.unitPrice) || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fields.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <h4 className="font-medium text-muted-foreground">Nessun articolo aggiunto</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa le schede sopra per aggiungere ricambi, servizi o voci manuali
                  </p>
                </div>
              )}

              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-medium flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Manodopera
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {laborCalculation && (
                    <Alert className="bg-emerald-500/5 border-emerald-500/20">
                      <Calculator className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-sm">
                        <span className="font-medium">Calcolato automaticamente:</span>{" "}
                        {formatCurrency(laborCalculation.hourlyRate)}/ora × {laborCalculation.estimatedHours}h = {formatCurrency(laborCalculation.calculatedCost)}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Fonte: {hourlyRateSource}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {diagnosisNotFound && !standalone && (
                    <Alert variant="default" className="bg-muted/50">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Diagnosi non ancora presente. Inserisci manualmente il costo manodopera.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wantAddLaborCostQuote"
                      checked={wantAddLaborCost}
                      onCheckedChange={(checked) => {
                        setWantAddLaborCost(checked === true);
                        if (!checked) form.setValue("laborCost", 0);
                      }}
                      data-testid="checkbox-want-labor-cost"
                    />
                    <Label htmlFor="wantAddLaborCostQuote" className="text-sm">
                      Aggiungi costo manodopera
                    </Label>
                  </div>
                  
                  {wantAddLaborCost && (
                    <FormField
                      control={form.control}
                      name="laborCost"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                className="w-32"
                                data-testid="input-labor-cost"
                              />
                            </FormControl>
                            <Euro className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between" type="button">
                    <span className="flex items-center gap-2 text-sm">
                      <StickyNote className="h-4 w-4" />
                      Opzioni Avanzate
                    </span>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="rounded-lg border bg-card p-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Valido Fino Al
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              className="w-48"
                              data-testid="input-valid-until"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
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
                          <FormLabel className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            Note
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Note aggiuntive o condizioni..."
                              rows={2}
                              data-testid="input-quote-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex-shrink-0 pt-4 mt-4 border-t bg-background">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {fields.length} articol{fields.length === 1 ? 'o' : 'i'} 
                  {wantAddLaborCost && watchLaborCost > 0 && ` + manodopera`}
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Totale Preventivo</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
              
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
                    : standalone ? "Conferma" : "Crea Preventivo"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
