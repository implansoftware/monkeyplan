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
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import type { PartsOrder } from "@shared/schema";

interface PartsOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const partsOrderSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Cost must be positive"),
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

  const form = useForm<PartsOrderFormData>({
    resolver: zodResolver(partsOrderSchema),
    defaultValues: {
      partName: "",
      partNumber: "",
      quantity: 1,
      unitCost: 0,
      supplier: "",
      expectedArrival: "",
      notes: "",
    },
  });

  const createPartMutation = useMutation({
    mutationFn: async (data: PartsOrderFormData) => {
      const payload = {
        partName: data.partName,
        partNumber: data.partNumber || null,
        quantity: data.quantity,
        unitCost: Math.round(data.unitCost * 100),
        supplier: data.supplier || null,
        expectedArrival: data.expectedArrival || null,
        notes: data.notes || null,
      };
      return await apiRequest(
        `/api/repair-orders/${repairOrderId}/parts`,
        "POST",
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: "Part ordered",
        description: "The spare part has been ordered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/parts-orders/${id}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: PartsOrderFormData) => {
    createPartMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ordered":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Ordered</Badge>;
      case "in_transit":
        return <Badge variant="secondary"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
      case "received":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
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
            Spare Parts Management
          </DialogTitle>
          <DialogDescription>
            Order and track spare parts for this repair
          </DialogDescription>
        </DialogHeader>

        {existingParts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Existing Parts Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {existingParts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`part-order-${part.id}`}
                >
                  <div className="space-y-1">
                    <div className="font-medium">{part.partName}</div>
                    <div className="text-sm text-muted-foreground">
                      {part.partNumber && <span>#{part.partNumber} - </span>}
                      Qty: {part.quantity} - {formatCurrency(part.unitCost)}
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
            <CardTitle className="text-base">Order New Part</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., LCD Display" data-testid="input-part-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="partNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., LCD-IP14-001" data-testid="input-part-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
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
                        <FormLabel>Unit Cost (EUR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" data-testid="input-unit-cost" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Supplier name" data-testid="input-supplier" />
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
                      <FormLabel>Expected Arrival</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-expected-arrival" />
                      </FormControl>
                      <FormDescription>When the part is expected to arrive</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes..." rows={2} data-testid="input-notes" />
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
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPartMutation.isPending}
                    data-testid="button-order-part"
                  >
                    {createPartMutation.isPending ? "Ordering..." : "Order Part"}
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
