import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RepairCenter, InsertRepairCenter, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MapPin, Phone, Mail, Pencil, Trash2, Building, Store } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/address-autocomplete";

export default function AdminRepairCenters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<RepairCenter | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const { toast } = useToast();

  const { data: centers = [], isLoading } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const createCenterMutation = useMutation({
    mutationFn: async (data: InsertRepairCenter) => {
      const res = await apiRequest("POST", "/api/admin/repair-centers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      setSelectedResellerId("");
      toast({ title: "Centro di riparazione creato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairCenter> }) => {
      const res = await apiRequest("PATCH", `/api/admin/repair-centers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      setSelectedResellerId("");
      toast({ title: "Centro aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/repair-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      toast({ title: "Centro eliminato" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingCenter) {
      const updates: Partial<RepairCenter> = {
        name: formData.get("name") as string,
        address: selectedAddress,
        city: selectedCity,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        resellerId: selectedResellerId || null,
      };
      updateCenterMutation.mutate({ id: editingCenter.id, data: updates });
    } else {
      const data: InsertRepairCenter = {
        name: formData.get("name") as string,
        address: selectedAddress,
        city: selectedCity,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        resellerId: selectedResellerId || null,
        isActive: true,
      };
      createCenterMutation.mutate(data);
    }
  };

  const filteredCenters = centers.filter((center) =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Centri di Riparazione</h1>
          <p className="text-muted-foreground">
            Gestisci tutti i centri di riparazione della rete
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCenter(null);
            setSelectedResellerId("");
            setSelectedAddress("");
            setSelectedCity("");
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-center">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Centro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCenter ? "Modifica Centro" : "Crea Nuovo Centro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Centro</Label>
                <Input id="name" name="name" defaultValue={editingCenter?.name || ""} required data-testid="input-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <AddressAutocomplete
                  id="address"
                  name="address"
                  value={selectedAddress || editingCenter?.address || ""}
                  onChange={setSelectedAddress}
                  onAddressSelect={(result) => {
                    setSelectedAddress(result.address);
                    setSelectedCity(result.city);
                  }}
                  placeholder="Inizia a digitare l'indirizzo..."
                  required
                  data-testid="input-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Città</Label>
                <Input
                  id="city"
                  name="city"
                  value={selectedCity || editingCenter?.city || ""}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  placeholder="Città"
                  required
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={editingCenter?.phone || ""} required data-testid="input-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingCenter?.email || ""} required data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resellerId">Rivenditore di Appartenenza</Label>
                <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
                  <SelectTrigger id="resellerId" data-testid="select-reseller-id">
                    <SelectValue placeholder="Seleziona un rivenditore" />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers.map((reseller) => (
                      <SelectItem key={reseller.id} value={reseller.id}>
                        {reseller.fullName} ({reseller.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createCenterMutation.isPending || updateCenterMutation.isPending} data-testid="button-submit-center">
                {editingCenter 
                  ? (updateCenterMutation.isPending ? "Aggiornamento..." : "Aggiorna Centro")
                  : (createCenterMutation.isPending ? "Creazione..." : "Crea Centro")
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-centers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun centro di riparazione trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Località</TableHead>
                  <TableHead>Rivenditore</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id} data-testid={`row-center-${center.id}`}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{center.city}</div>
                          <div className="text-xs text-muted-foreground">{center.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {center.resellerId ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{resellers.find(r => r.id === center.resellerId)?.fullName || 'Rivenditore non trovato'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {center.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {center.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"}>
                        {center.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingCenter(center);
                            setSelectedResellerId(center.resellerId || "");
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-${center.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCenterMutation.mutate(center.id)}
                          disabled={deleteCenterMutation.isPending}
                          data-testid={`button-delete-${center.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
