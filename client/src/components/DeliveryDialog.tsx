import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
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
  DialogFooter,
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
import { PackageCheck, Store, Truck, UserCheck, CheckCircle, Camera, Download, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { SignaturePad } from "./SignaturePad";
import type { RepairDelivery, User } from "@shared/schema";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
  currentUser?: User | null;
}

function getDeliverySchema(t: (key: string) => string) {
  return z.object({
    deliveredTo: z.string().min(1, t("delivery.recipientRequired")),
    deliveryMethod: z.enum(["in_store", "courier", "pickup"]),
    idDocumentType: z.string().optional(),
    idDocumentNumber: z.string().optional(),
    idDocumentPhoto: z.string().optional(),
  });
}

interface SignatureData {
  signature: string | null;
  signerName: string;
}

export function DeliveryDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
  currentUser,
}: DeliveryDialogProps) {
  const { t } = useTranslation();
  const deliverySchema = getDeliverySchema(t);
  type DeliveryFormData = z.infer<typeof deliverySchema>;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customerSignature, setCustomerSignature] = useState<SignatureData>({
    signature: null,
    signerName: "",
  });
  const [technicianSignature, setTechnicianSignature] = useState<SignatureData>({
    signature: null,
    signerName: currentUser?.fullName || "",
  });

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
      idDocumentPhoto: "",
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t("common.error"),
        description: t("delivery.selectImageFile"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("delivery.imageMustBeLessThan10MB"),
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('repairOrderId', repairOrderId);

      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(t("attachment.uploadError"));
      }

      const data = await res.json();
      form.setValue('idDocumentPhoto', data.url);
      setDocumentPhotoPreview(data.url);
      toast({
        title: t("attachment.photoUploaded"),
        description: t("delivery.documentPhotoUploaded"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("attachment.cannotUploadPhoto"),
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    form.setValue('idDocumentPhoto', '');
    setDocumentPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadDeliveryDocument = () => {
    window.open(`/api/repair-orders/${repairOrderId}/delivery-document`, '_blank');
  };

  const deliverMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      const res = await apiRequest("POST", `/api/repair-orders/${repairOrderId}/deliver`, {
        deliveredTo: data.deliveredTo,
        deliveryMethod: data.deliveryMethod,
        idDocumentType: data.idDocumentType || null,
        idDocumentNumber: data.idDocumentNumber || null,
        idDocumentPhoto: data.idDocumentPhoto || null,
        customerSignature: customerSignature.signature,
        customerSignerName: customerSignature.signerName || data.deliveredTo,
        technicianSignature: technicianSignature.signature,
        technicianSignerName: technicianSignature.signerName,
      });
      return await res.json();
    },
    onSuccess: (data: { delivery: any; invoice: any | null }) => {
      const invoiceMsg = data.invoice 
        ? ` - ${t("delivery.invoiceGenerated", { number: data.invoice.invoiceNumber })}` 
        : "";
      toast({
        title: t("delivery.deliveryCompleted"),
        description: t("delivery.deliveredSuccessfully") + invoiceMsg,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "delivery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
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
        return t("delivery.inStorePickup");
      case "courier":
        return t("shipping.courierShipping");
      case "pickup":
        return t("delivery.customerPickup");
      default:
        return method;
    }
  };

  if (existingDelivery) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="relative pb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-t-lg -m-6 mb-0 p-6" />
            <DialogTitle className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-lg font-semibold">{t("delivery.deliveryCompleted")}</span>
                <DialogDescription className="mt-0.5">
                  {t("delivery.deviceAlreadyDelivered")}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <CardContent className="relative pt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default" className="gap-1 bg-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  {t("repair.delivered")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">{t("delivery.recipient")}</div>
                  <div className="font-medium">{existingDelivery.deliveredTo}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("common.method")}</div>
                  <div className="font-medium flex items-center gap-1">
                    {getMethodIcon(existingDelivery.deliveryMethod)}
                    {getMethodLabel(existingDelivery.deliveryMethod)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("common.date")}</div>
                  <div className="font-medium">
                    {format(new Date(existingDelivery.deliveredAt), "dd MMM yyyy HH:mm", { locale: it })}
                  </div>
                </div>
                {existingDelivery.idDocumentType && (
                  <div>
                    <div className="text-muted-foreground">{t("common.document")}</div>
                    <div className="font-medium">
                      {existingDelivery.idDocumentType}: {existingDelivery.idDocumentNumber}
                    </div>
                  </div>
                )}
              </div>

              {existingDelivery.notes && (
                <div>
                  <div className="text-muted-foreground text-sm">{t("common.notes")}</div>
                  <div className="text-sm">{existingDelivery.notes}</div>
                </div>
              )}

              {existingDelivery.idDocumentPhoto && (
                <div>
                  <div className="text-muted-foreground text-sm mb-2">{t("delivery.documentPhoto")}</div>
                  <a 
                    href={existingDelivery.idDocumentPhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src={existingDelivery.idDocumentPhoto} 
                      alt={t("delivery.documentPhoto")} 
                      className="max-h-32 rounded border hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={downloadDeliveryDocument}
              className="gap-2"
              data-testid="button-download-document"
            >
              <Download className="h-4 w-4" />
              {t("delivery.downloadDocument")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-t-lg -m-6 mb-0 p-6" />
          <DialogTitle className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-semibold">{t("delivery.completeDelivery")}</span>
              <DialogDescription className="mt-0.5">
                {t("delivery.registerDeliveryDescription")}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
        <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-2">
            <FormField
              control={form.control}
              name="deliveredTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("delivery.recipientName")} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("delivery.fullNamePickup")}
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
                  <FormLabel>{t("delivery.deliveryMethod")} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-delivery-method">
                        <SelectValue placeholder={t("shipping.selectMethod")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_store">
                        <div className="flex flex-wrap items-center gap-2">
                          <Store className="h-4 w-4" />
                          {t("delivery.inStorePickup")}
                        </div>
                      </SelectItem>
                      <SelectItem value="courier">
                        <div className="flex flex-wrap items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {t("shipping.courierShipping")}
                        </div>
                      </SelectItem>
                      <SelectItem value="pickup">
                        <div className="flex flex-wrap items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          {t("delivery.customerPickup")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="idDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("delivery.documentType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-id-type">
                          <SelectValue placeholder={t("common.select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carta_identita">{t("delivery.idCard")}</SelectItem>
                        <SelectItem value="patente">{t("delivery.drivingLicense")}</SelectItem>
                        <SelectItem value="passaporto">{t("delivery.passport")}</SelectItem>
                        <SelectItem value="altro">{t("common.other")}</SelectItem>
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
                    <FormLabel>{t("delivery.documentNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("delivery.documentNumber")}
                        data-testid="input-id-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel className="block mb-2">{t("delivery.documentPhoto")}</FormLabel>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
                data-testid="input-document-photo"
              />
              {documentPhotoPreview ? (
                <div className="relative inline-block">
                  <img 
                    src={documentPhotoPreview} 
                    alt={t("delivery.documentPreview")} 
                    className="max-h-32 rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removePhoto}
                    data-testid="button-remove-photo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="gap-2"
                  data-testid="button-upload-photo"
                >
                  {isUploadingPhoto ? (
                    <>{t("common.loading")}</>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      {t("delivery.uploadDocumentPhoto")}
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("delivery.uploadDocumentPhotoDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
              <SignaturePad
                title={t("delivery.customerSignature")}
                signerName={customerSignature.signerName || form.watch("deliveredTo")}
                onSignatureChange={(sig, name) => {
                  setCustomerSignature({
                    signature: sig,
                    signerName: name || form.watch("deliveredTo") || "",
                  });
                }}
              />
              <SignaturePad
                title={t("delivery.technicianSignature")}
                signerName={technicianSignature.signerName}
                onSignatureChange={(sig, name) => {
                  setTechnicianSignature({
                    signature: sig,
                    signerName: name || technicianSignature.signerName,
                  });
                }}
              />
            </div>

        </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={deliverMutation.isPending}
                data-testid="button-complete-delivery"
              >
                {deliverMutation.isPending ? t("common.processing") : t("delivery.completeDelivery")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
