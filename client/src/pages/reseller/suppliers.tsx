import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Truck, Search, Mail, Phone, MapPin, Plus, Pencil, Trash2, Globe, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Supplier = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  vatNumber: string | null;
  fiscalCode: string | null;
  deliveryDays: number | null;
  isActive: boolean;
  createdBy: string | null;
  isGlobal: boolean;
  isOwn: boolean;
};

type SupplierFormData = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  vatNumber: string;
  fiscalCode: string;
  deliveryDays: string;
};

const initialFormData: SupplierFormData = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  zipCode: "",
  country: "IT",
  vatNumber: "",
  fiscalCode: "",
  deliveryDays: "3",
};

export default function ResellerSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/reseller/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      return apiRequest("POST", "/api/reseller/suppliers", {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        address: data.address || null,
        city: data.city || null,
        zipCode: data.zipCode || null,
        country: data.country || "IT",
        vatNumber: data.vatNumber || null,
        fiscalCode: data.fiscalCode || null,
        deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore creato", description: "Il nuovo fornitore è stato aggiunto con successo" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      return apiRequest("PATCH", `/api/reseller/suppliers/${id}`, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        address: data.address || null,
        city: data.city || null,
        zipCode: data.zipCode || null,
        country: data.country || "IT",
        vatNumber: data.vatNumber || null,
        fiscalCode: data.fiscalCode || null,
        deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore aggiornato", description: "Le modifiche sono state salvate" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore eliminato", description: "Il fornitore è stato rimosso" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      whatsapp: supplier.whatsapp || "",
      address: supplier.address || "",
      city: supplier.city || "",
      zipCode: supplier.zipCode || "",
      country: supplier.country || "IT",
      vatNumber: supplier.vatNumber || "",
      fiscalCode: supplier.fiscalCode || "",
      deliveryDays: supplier.deliveryDays?.toString() || "3",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome del fornitore è obbligatorio", variant: "destructive" });
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const globalSuppliers = filteredSuppliers.filter(s => s.isGlobal);
  const ownSuppliers = filteredSuppliers.filter(s => s.isOwn);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Fornitori</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            {globalSuppliers.length} globali
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            {ownSuppliers.length} personali
          </Badge>
          <Button onClick={handleOpenCreate} data-testid="button-add-supplier">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Fornitore
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Elenco Fornitori
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca fornitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun fornitore trovato</p>
              <p className="text-sm mt-1">Clicca su "Nuovo Fornitore" per aggiungere il tuo primo fornitore</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Tempi Consegna</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-[100px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell>
                      {supplier.isGlobal ? (
                        <Badge variant="outline" className="gap-1" data-testid={`badge-supplier-type-${supplier.id}`}>
                          <Globe className="h-3 w-3" />
                          Globale
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-supplier-type-${supplier.id}`}>
                          <User className="h-3 w-3" />
                          Personale
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-supplier-code-${supplier.id}`}>
                      {supplier.code}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                      {supplier.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`text-supplier-email-${supplier.id}`}>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span data-testid={`text-supplier-phone-${supplier.id}`}>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span data-testid={`text-supplier-city-${supplier.id}`}>{supplier.city}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-supplier-delivery-${supplier.id}`}>
                      {supplier.deliveryDays ? `${supplier.deliveryDays} giorni` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"} data-testid={`badge-supplier-status-${supplier.id}`}>
                        {supplier.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.isOwn && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(supplier)}
                            data-testid={`button-edit-supplier-${supplier.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(supplier.id)}
                            data-testid={`button-delete-supplier-${supplier.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Modifica Fornitore" : "Nuovo Fornitore"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome / Ragione Sociale *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome del fornitore"
                data-testid="input-supplier-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@esempio.it"
                data-testid="input-supplier-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 123 456 7890"
                data-testid="input-supplier-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+39 123 456 7890"
                data-testid="input-supplier-whatsapp"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Via Roma 123"
                data-testid="input-supplier-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Milano"
                data-testid="input-supplier-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CAP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="20100"
                data-testid="input-supplier-zipcode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">Partita IVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                placeholder="IT12345678901"
                data-testid="input-supplier-vat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalCode">Codice Fiscale</Label>
              <Input
                id="fiscalCode"
                value={formData.fiscalCode}
                onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })}
                placeholder="RSSMRA80A01H501U"
                data-testid="input-supplier-fiscal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDays">Tempi di Consegna (giorni)</Label>
              <Input
                id="deliveryDays"
                type="number"
                min="1"
                value={formData.deliveryDays}
                onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })}
                placeholder="3"
                data-testid="input-supplier-delivery"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sei sicuro di voler eliminare questo fornitore? L'operazione non può essere annullata.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
