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
import { PackageCheck, Store, Truck, UserCheck, CheckCircle, Camera, Download, Image, X } from "lucide-react";
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
  deliveredTo: z.string().min(1, "Il nome del destinatario è obbligatorio"),
  deliveryMethod: z.enum(["in_store", "courier", "pickup"]),
  idDocumentType: z.string().optional(),
  idDocumentNumber: z.string().optional(),
  idDocumentPhoto: z.string().optional(),
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
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      notes: "",
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Per favore seleziona un file immagine",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "L'immagine deve essere inferiore a 10MB",
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
        throw new Error('Errore durante il caricamento');
      }

      const data = await res.json();
      form.setValue('idDocumentPhoto', data.url);
      setDocumentPhotoPreview(data.url);
      toast({
        title: "Foto caricata",
        description: "La foto del documento è stata caricata",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare la foto",
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
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/deliver`, {
        deliveredTo: data.deliveredTo,
        deliveryMethod: data.deliveryMethod,
        idDocumentType: data.idDocumentType || null,
        idDocumentNumber: data.idDocumentNumber || null,
        idDocumentPhoto: data.idDocumentPhoto || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Consegna completata",
        description: "Il dispositivo è stato consegnato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "delivery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
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
        return "Ritiro in Negozio";
      case "courier":
        return "Spedizione Corriere";
      case "pickup":
        return "Ritiro Cliente";
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
              Consegna Completata
            </DialogTitle>
            <DialogDescription>
              Questo dispositivo è già stato consegnato
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Consegnato
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Destinatario</div>
                  <div className="font-medium">{existingDelivery.deliveredTo}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Metodo</div>
                  <div className="font-medium flex items-center gap-1">
                    {getMethodIcon(existingDelivery.deliveryMethod)}
                    {getMethodLabel(existingDelivery.deliveryMethod)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Data</div>
                  <div className="font-medium">
                    {format(new Date(existingDelivery.deliveredAt), "dd MMM yyyy HH:mm", { locale: it })}
                  </div>
                </div>
                {existingDelivery.idDocumentType && (
                  <div>
                    <div className="text-muted-foreground">Documento</div>
                    <div className="font-medium">
                      {existingDelivery.idDocumentType}: {existingDelivery.idDocumentNumber}
                    </div>
                  </div>
                )}
              </div>

              {existingDelivery.notes && (
                <div>
                  <div className="text-muted-foreground text-sm">Note</div>
                  <div className="text-sm">{existingDelivery.notes}</div>
                </div>
              )}

              {existingDelivery.idDocumentPhoto && (
                <div>
                  <div className="text-muted-foreground text-sm mb-2">Foto Documento</div>
                  <a 
                    href={existingDelivery.idDocumentPhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src={existingDelivery.idDocumentPhoto} 
                      alt="Foto documento" 
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
              Scarica Documento
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
              Chiudi
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
            Completa Consegna
          </DialogTitle>
          <DialogDescription>
            Registra la consegna del dispositivo al cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deliveredTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Destinatario *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome completo della persona che ritira"
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
                  <FormLabel>Metodo Consegna *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-delivery-method">
                        <SelectValue placeholder="Seleziona metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_store">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Ritiro in Negozio
                        </div>
                      </SelectItem>
                      <SelectItem value="courier">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Spedizione Corriere
                        </div>
                      </SelectItem>
                      <SelectItem value="pickup">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Ritiro Cliente
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
                    <FormLabel>Tipo Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-id-type">
                          <SelectValue placeholder="Seleziona" />
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
                    <FormLabel>Numero Documento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Numero documento"
                        data-testid="input-id-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel className="block mb-2">Foto Documento</FormLabel>
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
                    alt="Anteprima documento" 
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
                    <>Caricamento...</>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Carica Foto Documento
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Carica una foto del documento di identità (opzionale)
              </p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Note aggiuntive sulla consegna..."
                      rows={2}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    Eventuali osservazioni sulla consegna
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
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={deliverMutation.isPending}
                data-testid="button-complete-delivery"
              >
                {deliverMutation.isPending ? "Elaborazione..." : "Completa Consegna"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
