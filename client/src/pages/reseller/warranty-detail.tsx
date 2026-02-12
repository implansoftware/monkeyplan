import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft, Shield, Calendar, User, Smartphone, Mail, Phone,
  Pencil, Trash2, Save, X, AlertTriangle, CheckCircle2, Clock, Hash,
} from "lucide-react";

type WarrantyDetail = {
  id: string;
  repairOrderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceType: string;
  brand: string;
  deviceModel: string;
  serialNumber: string;
  productName: string;
  coverageType: string;
  durationMonths: number;
  price: number;
  status: "offered" | "accepted" | "declined" | "expired";
  notes: string;
  startsAt: string | null;
  endsAt: string | null;
  offeredAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  daysRemaining: number | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  offered: { label: "In Attesa", variant: "secondary" },
  accepted: { label: "Attiva", variant: "default" },
  declined: { label: "Rifiutata", variant: "destructive" },
  expired: { label: "Scaduta", variant: "outline" },
};

const coverageLabels: Record<string, string> = {
  basic: "Base",
  extended: "Estesa",
  full: "Completa",
};

export default function ResellerWarrantyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [editForm, setEditForm] = useState({
    notes: "",
    productName: "",
    coverageType: "",
    durationMonths: 0,
    price: 0,
  });

  const { data: warranty, isLoading } = useQuery<WarrantyDetail>({
    queryKey: ["/api/reseller/warranties", id],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/warranties/${id}`);
      if (!res.ok) throw new Error("Errore caricamento garanzia");
      return res.json();
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PATCH", `/api/reseller/warranties/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/warranties", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/warranties"] });
      setIsEditing(false);
      toast({ title: "Garanzia aggiornata", description: "Le modifiche sono state salvate con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Impossibile aggiornare la garanzia", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/reseller/warranties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/warranties"] });
      toast({ title: "Garanzia cancellata", description: "La garanzia è stata rimossa con successo." });
      navigate("/reseller/warranties");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Impossibile cancellare la garanzia", variant: "destructive" });
    },
  });

  function startEditing() {
    if (!warranty) return;
    setEditForm({
      notes: warranty.notes,
      productName: warranty.productName,
      coverageType: warranty.coverageType,
      durationMonths: warranty.durationMonths,
      price: warranty.price / 100,
    });
    setIsEditing(true);
  }

  function handleSave() {
    if (!warranty) return;
    const updates: Record<string, any> = {};
    if (editForm.notes !== warranty.notes) updates.notes = editForm.notes;
    if (warranty.status === "offered") {
      if (editForm.productName !== warranty.productName) updates.productNameSnapshot = editForm.productName;
      if (editForm.coverageType !== warranty.coverageType) updates.coverageTypeSnapshot = editForm.coverageType;
      if (editForm.durationMonths !== warranty.durationMonths) updates.durationMonthsSnapshot = editForm.durationMonths;
      const priceCents = Math.round(editForm.price * 100);
      if (priceCents !== warranty.price) updates.priceSnapshot = priceCents;
    }
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(updates);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/reseller/warranties")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle garanzie
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Garanzia non trovata</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[warranty.status] || statusConfig.offered;
  const isActive = warranty.status === "accepted" && warranty.daysRemaining !== null && warranty.daysRemaining > 0;
  const canEdit = warranty.status === "offered" || warranty.status === "accepted";
  const canDelete = warranty.status === "offered";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/reseller/warranties")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle garanzie
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && !isEditing && (
            <Button variant="outline" onClick={startEditing} data-testid="button-edit-warranty">
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-warranty">
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </>
          )}
          {canDelete && !isEditing && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} data-testid="button-delete-warranty">
              <Trash2 className="h-4 w-4 mr-2" />
              Cancella
            </Button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-warranty-name">
                {warranty.productName}
              </h1>
              <p className="text-sm text-white/80">Ordine #{warranty.orderNumber}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {warranty.daysRemaining !== null && warranty.status === "accepted" && (
              <Badge variant="outline" className={`gap-1 text-xs border-white/30 ${
                warranty.daysRemaining <= 0
                  ? "text-red-200"
                  : warranty.daysRemaining <= 30
                    ? "text-amber-200"
                    : "text-emerald-200"
              }`}>
                {warranty.daysRemaining <= 0 ? (
                  <><AlertTriangle className="h-3 w-3" />Scaduta</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3" />{warranty.daysRemaining}g rimasti</>
                )}
              </Badge>
            )}
            <Badge variant={status.variant} data-testid="badge-warranty-status">{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Nome</p>
                <p className="font-medium" data-testid="text-customer-name">{warranty.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-customer-email">{warranty.customerEmail || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Telefono</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-customer-phone">{warranty.customerPhone || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Tipo</p>
                <p className="font-medium" data-testid="text-device-type">{warranty.deviceType || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Marca e Modello</p>
                <p className="font-medium" data-testid="text-device-model">
                  {[warranty.brand, warranty.deviceModel].filter(Boolean).join(" ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Numero Seriale</p>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-serial-number">{warranty.serialNumber || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Ordine Riparazione</p>
                <p className="font-medium" data-testid="text-order-number">#{warranty.orderNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Dettagli Garanzia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {warranty.status === "offered" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="productName">Nome Prodotto</Label>
                      <Input
                        id="productName"
                        value={editForm.productName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, productName: e.target.value }))}
                        data-testid="input-product-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverageType">Tipo Copertura</Label>
                      <Select
                        value={editForm.coverageType}
                        onValueChange={(v) => setEditForm(prev => ({ ...prev, coverageType: v }))}
                      >
                        <SelectTrigger data-testid="select-coverage-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Base</SelectItem>
                          <SelectItem value="extended">Estesa</SelectItem>
                          <SelectItem value="full">Completa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="durationMonths">Durata (mesi)</Label>
                      <Input
                        id="durationMonths"
                        type="number"
                        min={1}
                        value={editForm.durationMonths}
                        onChange={(e) => setEditForm(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 0 }))}
                        data-testid="input-duration-months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Prezzo (EUR)</Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-price"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="resize-none"
                  rows={4}
                  data-testid="input-notes"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Prodotto</p>
                  <p className="font-medium" data-testid="text-product-name">{warranty.productName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Copertura</p>
                  <p className="font-medium" data-testid="text-coverage">{coverageLabels[warranty.coverageType] || warranty.coverageType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Durata</p>
                  <p className="font-medium" data-testid="text-duration">{warranty.durationMonths} mesi</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Prezzo</p>
                  <p className="font-medium" data-testid="text-price">
                    {(warranty.price / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                  </p>
                </div>
              </div>

              {warranty.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Note</p>
                  <p className="font-medium whitespace-pre-wrap" data-testid="text-notes">{warranty.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cronologia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Offerta inviata</p>
                <p className="text-muted-foreground">{format(new Date(warranty.offeredAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
              </div>
            </div>

            {warranty.acceptedAt && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">Accettata dal cliente</p>
                  <p className="text-muted-foreground">{format(new Date(warranty.acceptedAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
                </div>
              </div>
            )}

            {warranty.declinedAt && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Rifiutata dal cliente</p>
                  <p className="text-muted-foreground">{format(new Date(warranty.declinedAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
                </div>
              </div>
            )}

            {warranty.startsAt && warranty.endsAt && (
              <div className={`flex items-center gap-3 p-3 rounded-md ${
                warranty.daysRemaining !== null && warranty.daysRemaining <= 0
                  ? "bg-red-50 dark:bg-red-950"
                  : warranty.daysRemaining !== null && warranty.daysRemaining <= 30
                    ? "bg-amber-50 dark:bg-amber-950"
                    : "bg-emerald-50 dark:bg-emerald-950"
              }`}>
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Periodo di validità</p>
                  <p className="text-muted-foreground">
                    Dal {format(new Date(warranty.startsAt), "dd/MM/yyyy", { locale: it })} al {format(new Date(warranty.endsAt), "dd/MM/yyyy", { locale: it })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Cancellazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler cancellare questa garanzia? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-md bg-destructive/10 text-sm">
            <p className="font-medium">{warranty.productName}</p>
            <p className="text-muted-foreground">Cliente: {warranty.customerName}</p>
            <p className="text-muted-foreground">Ordine: #{warranty.orderNumber}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Cancellazione..." : "Cancella Garanzia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
