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
import { PackageCheck, Store, Truck, UserCheck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { RepairDelivery } from "@shared/schema";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const deliverySchema = z.object({
  deliveredTo: z.string().min(1, "Recipient name is required"),
  deliveryMethod: z.enum(["in_store", "courier", "pickup"]),
  idDocumentType: z.string().optional(),
  idDocumentNumber: z.string().optional(),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export function DeliveryDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: DeliveryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingDelivery } = useQuery<RepairDelivery | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "delivery"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/delivery`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch delivery");
      return res.json();
    },
    enabled: open,
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveredTo: "",
      deliveryMethod: "in_store",
      idDocumentType: "",
      idDocumentNumber: "",
      notes: "",
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      return await apiRequest(`/api/repair-orders/${repairOrderId}/deliver`, "POST", {
        deliveredTo: data.deliveredTo,
        deliveryMethod: data.deliveryMethod,
        idDocumentType: data.idDocumentType || null,
        idDocumentNumber: data.idDocumentNumber || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Delivery completed",
        description: "The device has been successfully delivered",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "delivery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      form.reset();
      onOpenChange(false);
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

  const onSubmit = (data: DeliveryFormData) => {
    deliverMutation.mutate(data);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "in_store":
        return <Store className="h-4 w-4" />;
      case "courier":
        return <Truck className="h-4 w-4" />;
      case "pickup":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <PackageCheck className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "in_store":
        return "In-Store Pickup";
      case "courier":
        return "Courier Delivery";
      case "pickup":
        return "Customer Pickup";
      default:
        return method;
    }
  };

  if (existingDelivery) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-600" />
              Delivery Completed
            </DialogTitle>
            <DialogDescription>
              This device has already been delivered
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Delivered
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Recipient</div>
                  <div className="font-medium">{existingDelivery.deliveredTo}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Method</div>
                  <div className="font-medium flex items-center gap-1">
                    {getMethodIcon(existingDelivery.deliveryMethod)}
                    {getMethodLabel(existingDelivery.deliveryMethod)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {format(new Date(existingDelivery.deliveredAt), "dd MMM yyyy HH:mm", { locale: it })}
                  </div>
                </div>
                {existingDelivery.idDocumentType && (
                  <div>
                    <div className="text-muted-foreground">ID Document</div>
                    <div className="font-medium">
                      {existingDelivery.idDocumentType}: {existingDelivery.idDocumentNumber}
                    </div>
                  </div>
                )}
              </div>

              {existingDelivery.notes && (
                <div>
                  <div className="text-muted-foreground text-sm">Notes</div>
                  <div className="text-sm">{existingDelivery.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Complete Delivery
          </DialogTitle>
          <DialogDescription>
            Record the device delivery to the customer
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deliveredTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full name of person receiving the device"
                      data-testid="input-delivered-to"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Method *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-delivery-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_store">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          In-Store Pickup
                        </div>
                      </SelectItem>
                      <SelectItem value="courier">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Courier Delivery
                        </div>
                      </SelectItem>
                      <SelectItem value="pickup">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Customer Pickup
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="idDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-id-type">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carta_identita">Carta d'Identità</SelectItem>
                        <SelectItem value="patente">Patente</SelectItem>
                        <SelectItem value="passaporto">Passaporto</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idDocumentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ID number"
                        data-testid="input-id-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about the delivery..."
                      rows={2}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    Any observations about the delivery
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={deliverMutation.isPending}
                data-testid="button-complete-delivery"
              >
                {deliverMutation.isPending ? "Processing..." : "Complete Delivery"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
