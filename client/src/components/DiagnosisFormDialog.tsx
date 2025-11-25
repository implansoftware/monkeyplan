import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope } from "lucide-react";

interface DiagnosisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const diagnosisSchema = z.object({
  technicalDiagnosis: z.string().min(10, "La diagnosi deve contenere almeno 10 caratteri"),
  damagedComponents: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  estimatedRepairTime: z.coerce.number().min(0).optional(),
  requiresExternalParts: z.boolean().default(false),
  diagnosisNotes: z.string().optional(),
  photos: z.string().optional(),
});

type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

export function DiagnosisFormDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: DiagnosisFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      technicalDiagnosis: "",
      damagedComponents: "",
      severity: "medium",
      estimatedRepairTime: undefined,
      requiresExternalParts: false,
      diagnosisNotes: "",
      photos: "",
    },
  });

  const createDiagnosisMutation = useMutation({
    mutationFn: async (data: DiagnosisFormData) => {
      const payload = {
        technicalDiagnosis: data.technicalDiagnosis,
        damagedComponents: data.damagedComponents
          ? data.damagedComponents.split(",").map((c) => c.trim())
          : [],
        severity: data.severity,
        estimatedRepairTime: data.estimatedRepairTime,
        requiresExternalParts: data.requiresExternalParts,
        diagnosisNotes: data.diagnosisNotes,
        photos: data.photos ? data.photos.split(",").map((p) => p.trim()) : [],
      };
      return await apiRequest(
        `/api/repair-orders/${repairOrderId}/diagnostics`,
        "POST",
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: "Diagnosi creata",
        description: "La diagnosi tecnica è stata registrata con successo",
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

  const onSubmit = (data: DiagnosisFormData) => {
    createDiagnosisMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Diagnosi Tecnica
          </DialogTitle>
          <DialogDescription>
            Registra i risultati della diagnosi tecnica per questa lavorazione
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dettagli Diagnosi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="technicalDiagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosi Tecnica *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrizione dettagliata del problema riscontrato..."
                          rows={4}
                          data-testid="input-technical-diagnosis"
                        />
                      </FormControl>
                      <FormDescription>
                        Descrivi i risultati tecnici e la causa del problema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="damagedComponents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Componenti Danneggiati</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="es. Display, Batteria, Scheda madre (separati da virgola)"
                          data-testid="input-damaged-components"
                        />
                      </FormControl>
                      <FormDescription>
                        Elenca i componenti danneggiati separati da virgola
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livello di Gravità *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-severity">
                            <SelectValue placeholder="Seleziona gravità" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Basso - Problema minore</SelectItem>
                          <SelectItem value="medium">
                            Medio - Danno moderato
                          </SelectItem>
                          <SelectItem value="high">
                            Alto - Danno grave
                          </SelectItem>
                          <SelectItem value="critical">
                            Critico - Danno severo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        La gravità determina la priorità della riparazione
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedRepairTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo Stimato di Riparazione (ore)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.5"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="es. 2.5"
                          data-testid="input-estimated-time"
                        />
                      </FormControl>
                      <FormDescription>
                        Tempo stimato in ore per completare la riparazione
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresExternalParts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-requires-parts"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Richiede Ricambi Esterni</FormLabel>
                        <FormDescription>
                          Spunta se è necessario ordinare ricambi esternamente
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosisNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Osservazioni o raccomandazioni aggiuntive..."
                          rows={3}
                          data-testid="input-diagnosis-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Foto</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="URL delle foto (separati da virgola)"
                          data-testid="input-photos"
                        />
                      </FormControl>
                      <FormDescription>
                        Inserisci gli URL delle foto separati da virgola
                      </FormDescription>
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
                disabled={createDiagnosisMutation.isPending}
                data-testid="button-submit-diagnosis"
              >
                {createDiagnosisMutation.isPending
                  ? "Creazione..."
                  : "Crea Diagnosi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
