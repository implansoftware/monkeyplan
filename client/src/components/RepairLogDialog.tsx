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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Clock, Wrench, MessageSquare, TestTube, Phone } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { RepairLog } from "@shared/schema";

interface RepairLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const repairLogSchema = z.object({
  logType: z.enum(["status_change", "technician_note", "parts_installed", "test_result", "customer_contact"]),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  hoursWorked: z.coerce.number().min(0).optional(),
});

type RepairLogFormData = z.infer<typeof repairLogSchema>;

const logTypeLabels: Record<string, { label: string; icon: typeof Clock }> = {
  status_change: { label: "Cambio Stato", icon: Clock },
  technician_note: { label: "Nota Tecnico", icon: MessageSquare },
  parts_installed: { label: "Parti Installate", icon: Wrench },
  test_result: { label: "Risultato Test", icon: TestTube },
  customer_contact: { label: "Contatto Cliente", icon: Phone },
};

export function RepairLogDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: RepairLogDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery<RepairLog[]>({
    queryKey: ["/api/repair-orders", repairOrderId, "logs"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/logs`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: open,
  });

  const form = useForm<RepairLogFormData>({
    resolver: zodResolver(repairLogSchema),
    defaultValues: {
      logType: "technician_note",
      description: "",
      hoursWorked: undefined,
    },
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: RepairLogFormData) => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/logs`, {
        logType: data.logType,
        description: data.description,
        hoursWorked: data.hoursWorked ?? null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Log aggiunto",
        description: "Il log di riparazione è stato aggiunto con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "logs"] });
      form.reset();
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

  const onSubmit = (data: RepairLogFormData) => {
    createLogMutation.mutate(data);
  };

  const getLogIcon = (logType: string) => {
    const config = logTypeLabels[logType];
    if (!config) return <ClipboardList className="h-4 w-4" />;
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getLogBadgeVariant = (logType: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (logType) {
      case "status_change":
        return "default";
      case "parts_installed":
        return "secondary";
      case "test_result":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Log Attività Riparazione
          </DialogTitle>
          <DialogDescription>
            Traccia le attività del tecnico e l'avanzamento della riparazione
          </DialogDescription>
        </DialogHeader>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storico Attività</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 p-3 border rounded-lg"
                      data-testid={`log-entry-${log.id}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getLogIcon(log.logType)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getLogBadgeVariant(log.logType)}>
                            {logTypeLabels[log.logType]?.label || log.logType}
                          </Badge>
                          {log.hoursWorked && (
                            <span className="text-xs text-muted-foreground">
                              {log.hoursWorked}h lavorate
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aggiungi Nuova Voce</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="logType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Attività *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-log-type">
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technician_note">Nota Tecnico</SelectItem>
                            <SelectItem value="parts_installed">Parti Installate</SelectItem>
                            <SelectItem value="test_result">Risultato Test</SelectItem>
                            <SelectItem value="customer_contact">Contatto Cliente</SelectItem>
                            <SelectItem value="status_change">Cambio Stato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hoursWorked"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ore Lavorate</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            data-testid="input-hours-worked"
                          />
                        </FormControl>
                        <FormDescription>Tracciamento tempo opzionale</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivi l'attività eseguita..."
                          rows={3}
                          data-testid="input-description"
                        />
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
                    disabled={createLogMutation.isPending}
                    data-testid="button-add-log"
                  >
                    {createLogMutation.isPending ? "Salvataggio..." : "Aggiungi Log"}
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
