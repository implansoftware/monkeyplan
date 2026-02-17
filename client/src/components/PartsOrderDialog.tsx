import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Truck, CheckCircle, Clock, Warehouse, FileText, Plus, 
  Loader2, ShoppingCart, Trash2, Building, X, Send, Calendar 
} from "lucide-react";
import type { PartsOrder, Product, RepairQuote, Supplier, Warehouse as WarehouseType } from "@shared/schema";

interface QuotePart {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface CartItem {
  id: string;
  productId?: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

interface PartsOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

type DestinationType = "external_supplier" | "internal_warehouse";

interface PurchaseOrderWithItems {
  id: string;
  orderNumber: string;
  repairOrderId: string;
  destinationType: string;
  supplierName: string | null;
  supplierId: string | null;
  sourceWarehouseId: string | null;
  totalAmount: number;
  status: string;
  expectedArrival: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  items: PartsOrder[];
}

export function PartsOrderDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: PartsOrderDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"order" | "existing">("order");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [destinationType, setDestinationType] = useState<DestinationType>("external_supplier");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>("");
  const [expectedArrival, setExpectedArrival] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setCart([]);
      setDestinationType("external_supplier");
      setSelectedSupplierId("");
      setSupplierName("");
      setSourceWarehouseId("");
      setExpectedArrival("");
      setOrderNotes("");
    }
  }, [open]);

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

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers/list"],
    enabled: open,
  });

  const { data: warehouses = [] } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses/accessible"],
    enabled: open,
  });

  const { data: purchaseOrders = [] } = useQuery<PurchaseOrderWithItems[]>({
    queryKey: ["/api/repair-orders", repairOrderId, "purchase-orders"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/purchase-orders`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
    enabled: open,
  });

  const { data: quote } = useQuery<RepairQuote>({
    queryKey: ["/api/repair-orders", repairOrderId, "quote"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/quote`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch quote");
      }
      return res.json();
    },
    enabled: open,
  });

  const quoteParts: QuotePart[] = (() => {
    if (!quote?.parts) return [];
    try {
      const parsed = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const availableQuoteParts = (() => {
    const orderedQuantities = new Map<string, number>();
    existingParts.forEach(ep => {
      const key = ep.productId 
        ? `pid:${ep.productId}` 
        : `name:${ep.partName}:${ep.unitCost}`;
      orderedQuantities.set(key, (orderedQuantities.get(key) || 0) + (ep.quantity || 1));
    });

    cart.forEach(ci => {
      const key = ci.productId 
        ? `pid:${ci.productId}` 
        : `name:${ci.partName}:${ci.unitCost}`;
      orderedQuantities.set(key, (orderedQuantities.get(key) || 0) + ci.quantity);
    });

    const consumedQuantities = new Map<string, number>();

    return quoteParts
      .map((qp, originalIndex) => {
        const key = qp.productId 
          ? `pid:${qp.productId}` 
          : `name:${qp.name}:${qp.unitPrice}`;
        
        const totalOrdered = orderedQuantities.get(key) || 0;
        const alreadyConsumed = consumedQuantities.get(key) || 0;
        const remainingOrdered = Math.max(0, totalOrdered - alreadyConsumed);
        const remainingQuantity = qp.quantity - remainingOrdered;

        consumedQuantities.set(key, alreadyConsumed + qp.quantity);

        if (remainingQuantity > 0) {
          return { ...qp, quantity: remainingQuantity, originalIndex };
        }
        return null;
      })
      .filter((qp): qp is QuotePart & { originalIndex: number } => qp !== null);
  })();

  const addToCart = (part: QuotePart) => {
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: part.productId,
      partName: part.name,
      quantity: part.quantity,
      unitCost: part.unitPrice,
    };
    setCart(prev => [...prev, newItem]);
    toast({
      title: t("parts.addedToCart"),
      description: `${part.name} (${part.quantity}x)`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) {
        throw new Error(t("parts.cartEmpty"));
      }

      const resolvedSupplierName = destinationType === "external_supplier"
        ? (selectedSupplierId 
            ? suppliers.find(s => s.id === selectedSupplierId)?.name || supplierName
            : supplierName)
        : null;

      const payload = {
        destinationType,
        supplierName: resolvedSupplierName,
        supplierId: destinationType === "external_supplier" ? selectedSupplierId || null : null,
        sourceWarehouseId: destinationType === "internal_warehouse" ? sourceWarehouseId || null : null,
        expectedArrival: expectedArrival || null,
        notes: orderNotes || null,
        items: cart.map(item => ({
          productId: item.productId || null,
          partName: item.partName,
          partNumber: item.partNumber || null,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: item.notes || null,
        })),
      };

      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/purchase-orders`,
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: t("parts.orderCreated"),
        description: t("parts.orderCreatedWithItems", { count: cart.length }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      setCart([]);
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
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
      toast({ title: t("common.statusUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ordered":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{t("parts.ordered")}</Badge>;
      case "in_transit":
        return <Badge variant="secondary"><Truck className="h-3 w-3 mr-1" />{t("parts.inTransit")}</Badge>;
      case "received":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />{t("parts.received")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("common.cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents && cents !== 0) return "-";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent rounded-t-lg -m-6 mb-0 p-6" />
          <DialogTitle className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <span className="text-lg font-semibold">{t("parts.partsOrderManagement")}</span>
              <DialogDescription className="mt-0.5">
                {t("parts.createGroupedOrders")}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "order" | "existing")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="order" className="flex flex-wrap items-center gap-2" data-testid="tab-new-order">
              <ShoppingCart className="h-4 w-4" />
              {t("parts.newOrder")}
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-1">{cart.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex flex-wrap items-center gap-2" data-testid="tab-existing">
              <FileText className="h-4 w-4" />
              {t("parts.existingOrders")}
              {purchaseOrders.length > 0 && (
                <Badge variant="outline" className="ml-1">{purchaseOrders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-4 mt-4">
            {availableQuoteParts.length > 0 && (
              <Card className="relative overflow-hidden border-orange-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    {t("parts.partsFromQuote")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("parts.selectPartsToAdd")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availableQuoteParts.map((part, index) => (
                    <div
                      key={`quote-part-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                      data-testid={`quote-part-${index}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {part.imageUrl ? (
                          <img 
                            src={part.imageUrl} 
                            alt={part.name}
                            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{part.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {t("parts.qty")}: {part.quantity} - {formatCurrency(part.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-shrink-0"
                        onClick={() => addToCart(part)}
                        data-testid={`button-add-to-cart-${index}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("common.add")}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {availableQuoteParts.length === 0 && cart.length === 0 && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent pointer-events-none" />
                <CardContent className="relative py-8 text-center text-muted-foreground">
                  <div className="h-12 w-12 rounded-xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                  <p>{t("parts.noPartsFromQuote")}</p>
                  <p className="text-sm mt-2">{t("parts.allPartsOrdered")}</p>
                </CardContent>
              </Card>
            )}

            {cart.length > 0 && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                <CardHeader className="relative">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {t("parts.cart", { count: cart.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`cart-item-${item.id}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.partName}</span>
                          <span className="text-sm text-muted-foreground">
                            {t("parts.qty")}: {item.quantity} - {formatCurrency(item.unitCost)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(item.unitCost * item.quantity)}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="font-medium">{t("common.total")}:</span>
                  <span className="text-lg font-bold">{formatCurrency(cartTotal)}</span>
                </CardFooter>
              </Card>
            )}

            {cart.length > 0 && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                <CardHeader className="relative">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("parts.orderRecipient")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card 
                      className={`relative overflow-hidden cursor-pointer transition-all ${
                        destinationType === "external_supplier" 
                          ? "border-orange-500 ring-2 ring-orange-500/20" 
                          : "hover-elevate"
                      }`}
                      onClick={() => setDestinationType("external_supplier")}
                      data-testid="option-external-supplier"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                      <CardContent className="relative p-4 text-center">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                          <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h4 className="font-medium">{t("parts.externalSupplier")}</h4>
                        <p className="text-xs text-muted-foreground">{t("parts.orderFromSupplier")}</p>
                      </CardContent>
                    </Card>
                    <Card 
                      className={`relative overflow-hidden cursor-pointer transition-all ${
                        destinationType === "internal_warehouse" 
                          ? "border-blue-500 ring-2 ring-blue-500/20" 
                          : "hover-elevate"
                      }`}
                      onClick={() => setDestinationType("internal_warehouse")}
                      data-testid="option-internal-warehouse"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                      <CardContent className="relative p-4 text-center">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                          <Warehouse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-medium">{t("parts.internalWarehouse")}</h4>
                        <p className="text-xs text-muted-foreground">{t("parts.warehouseTransfer")}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {destinationType === "external_supplier" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">{t("common.supplier")}</label>
                        {suppliers.length > 0 ? (
                          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                            <SelectTrigger data-testid="select-supplier">
                              <SelectValue placeholder={t("products.selectSupplier")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">{t("common.otherEnterName")}</SelectItem>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={t("parts.supplierName")}
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            data-testid="input-supplier-name"
                          />
                        )}
                      </div>
                      {selectedSupplierId === "custom" && (
                        <div>
                          <label className="text-sm font-medium">{t("parts.supplierName")}</label>
                          <Input
                            placeholder={t("parts.enterSupplierName")}
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            data-testid="input-custom-supplier-name"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {destinationType === "internal_warehouse" && warehouses.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">{t("parts.sourceWarehouse")}</label>
                      <Select value={sourceWarehouseId} onValueChange={setSourceWarehouseId}>
                        <SelectTrigger data-testid="select-warehouse">
                          <SelectValue placeholder={t("quote.selectWarehouse")} />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {t("parts.expectedArrivalDate")}
                      </label>
                      <Input
                        type="date"
                        value={expectedArrival}
                        onChange={(e) => setExpectedArrival(e.target.value)}
                        data-testid="input-expected-arrival"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{t("parts.orderNotes")}</label>
                    <Textarea
                      placeholder={t("parts.additionalOrderNotes")}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      data-testid="input-order-notes"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCart([])}
                    data-testid="button-clear-cart"
                  >
                    {t("parts.clearCart")}
                  </Button>
                  <Button
                    onClick={() => createPurchaseOrderMutation.mutate()}
                    disabled={createPurchaseOrderMutation.isPending || cart.length === 0}
                    data-testid="button-confirm-order"
                  >
                    {createPurchaseOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("common.creating")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("parts.confirmOrder")}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {purchaseOrders.length > 0 ? (
              <div className="space-y-4">
                {purchaseOrders.map((po) => (
                  <Card key={po.id} data-testid={`purchase-order-${po.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-base font-semibold">
                            {po.orderNumber}
                          </CardTitle>
                          {po.destinationType === "internal_warehouse" ? (
                            <Badge variant="outline" className="text-xs">
                              <Warehouse className="h-3 w-3 mr-1" />
                              {t("parts.internalWarehouse")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {po.supplierName || t("common.supplier")}
                            </Badge>
                          )}
                        </div>
                        <Badge 
                          variant={po.status === "received" ? "default" : po.status === "shipped" ? "secondary" : "outline"}
                        >
                          {po.status === "submitted" && <Clock className="h-3 w-3 mr-1" />}
                          {po.status === "processing" && <Package className="h-3 w-3 mr-1" />}
                          {po.status === "shipped" && <Truck className="h-3 w-3 mr-1" />}
                          {po.status === "received" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {po.status === "submitted" ? t("common.sent") : 
                           po.status === "processing" ? t("parts.processing") :
                           po.status === "shipped" ? t("parts.shipped") :
                           po.status === "received" ? t("common.received") : po.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("common.total")}: {formatCurrency(po.totalAmount)} - {po.items.length} {t("parts.items")}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {po.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                            data-testid={`part-order-${item.id}`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{item.partName}</span>
                              <span className="text-sm text-muted-foreground">
                                x{item.quantity}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm">{formatCurrency(item.unitCost)}</span>
                              {getStatusBadge(item.status)}
                              {item.status === "ordered" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateStatusMutation.mutate({ id: item.id, status: "in_transit" })}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`button-transit-${item.id}`}
                                >
                                  <Truck className="h-3 w-3" />
                                </Button>
                              )}
                              {item.status === "in_transit" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateStatusMutation.mutate({ id: item.id, status: "received" })}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`button-receive-${item.id}`}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("parts.noPartsOrders")}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
