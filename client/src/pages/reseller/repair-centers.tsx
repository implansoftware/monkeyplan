import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RepairCenter, InsertRepairCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MapPin, Phone, Mail, Pencil, Trash2, Building, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useUser } from "@/hooks/use-user";

export default function ResellerRepairCenters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<RepairCenter | null>(null);
  const [addressData, setAddressData] = useState({ address: "", city: "", cap: "", provincia: "" });
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [useMyFiscalData, setUseMyFiscalData] = useState(false);
  const [fiscalFields, setFiscalFields] = useState({
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    iban: "",
    codiceUnivoco: "",
    pec: "",
  });
  const { toast } = useToast();
  const { user } = useUser();

  const { data: centers = [], isLoading } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const createCenterMutation = useMutation({
    mutationFn: async (data: Omit<InsertRepairCenter, 'resellerId'>) => {
      const res = await apiRequest("POST", "/api/reseller/repair-centers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      toast({ title: "Centro di riparazione creato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairCenter> }) => {
      const res = await apiRequest("PATCH", `/api/reseller/repair-centers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      toast({ title: "Centro aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reseller/repair-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      toast({ title: "Centro eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleUseMyFiscalDataChange = (checked: boolean) => {
    setUseMyFiscalData(checked);
    if (checked && user) {
      setFiscalFields({
        ragioneSociale: user.ragioneSociale || "",
        partitaIva: user.partitaIva || "",
        codiceFiscale: user.codiceFiscale || "",
        iban: user.iban || "",
        codiceUnivoco: user.codiceUnivoco || "",
        pec: user.pec || "",
      });
      if (user.indirizzo) {
        setAddressData({
          address: user.indirizzo || "",
          city: user.citta || "",
          cap: user.cap || "",
          provincia: user.provincia || "",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!addressData.address.trim() || !addressData.city.trim()) {
      toast({ title: "Errore", description: "Indirizzo e Città sono campi obbligatori", variant: "destructive" });
      return;
    }
    
    const fiscalData = {
      ragioneSociale: fiscalFields.ragioneSociale?.trim() || null,
      partitaIva: fiscalFields.partitaIva?.trim() || null,
      codiceFiscale: fiscalFields.codiceFiscale?.trim() || null,
      iban: fiscalFields.iban?.trim() || null,
      codiceUnivoco: fiscalFields.codiceUnivoco?.trim() || null,
      pec: fiscalFields.pec?.trim() || null,
    };
    
    const hourlyRateCentsValue = hourlyRateEuros 
      ? Math.round(parseFloat(hourlyRateEuros) * 100)
      : (editingCenter ? editingCenter.hourlyRateCents : null);
    
    if (editingCenter) {
      const updates: Partial<RepairCenter> = {
        name: formData.get("name") as string,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        hourlyRateCents: hourlyRateCentsValue,
        ...fiscalData,
      };
      updateCenterMutation.mutate({ id: editingCenter.id, data: updates });
    } else {
      const data = {
        name: formData.get("name") as string,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        isActive: true,
        hourlyRateCents: hourlyRateCentsValue,
        ...fiscalData,
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
          <h1 className="text-2xl font-semibold mb-2">I Miei Centri di Riparazione</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi centri di riparazione
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCenter(null);
            setAddressData({ address: "", city: "", cap: "", provincia: "" });
            setHourlyRateEuros("");
            setUseMyFiscalData(false);
            setFiscalFields({ ragioneSociale: "", partitaIva: "", codiceFiscale: "", iban: "", codiceUnivoco: "", pec: "" });
          } else if (!editingCenter) {
            setFiscalFields({ ragioneSociale: "", partitaIva: "", codiceFiscale: "", iban: "", codiceUnivoco: "", pec: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-center">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Centro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCenter ? "Modifica Centro" : "Crea Nuovo Centro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Centro *</Label>
                <Input id="name" name="name" defaultValue={editingCenter?.name || ""} required data-testid="input-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono *</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={editingCenter?.phone || ""} required data-testid="input-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" defaultValue={editingCenter?.email || ""} required data-testid="input-email" />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Dati Fiscali</h4>
                  {!editingCenter && (
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="useMyFiscalData" 
                        checked={useMyFiscalData}
                        onCheckedChange={(checked) => handleUseMyFiscalDataChange(checked as boolean)}
                        data-testid="checkbox-use-my-fiscal-data"
                      />
                      <Label htmlFor="useMyFiscalData" className="text-sm cursor-pointer">
                        Usa i miei dati fiscali
                      </Label>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                    <Input 
                      id="ragioneSociale" 
                      name="ragioneSociale" 
                      value={fiscalFields.ragioneSociale}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                      data-testid="input-ragioneSociale" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partitaIva">Partita IVA</Label>
                    <Input 
                      id="partitaIva" 
                      name="partitaIva" 
                      value={fiscalFields.partitaIva}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, partitaIva: e.target.value }))}
                      data-testid="input-partitaIva" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                    <Input 
                      id="codiceFiscale" 
                      name="codiceFiscale" 
                      value={fiscalFields.codiceFiscale}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                      data-testid="input-codiceFiscale" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Indirizzo *</Label>
                    <AddressAutocomplete
                      value={addressData.address}
                      onChange={(val) => setAddressData(prev => ({ ...prev, address: val }))}
                      onAddressSelect={(result) => {
                        setAddressData({
                          address: result.address || result.fullAddress,
                          city: result.city,
                          cap: result.postalCode,
                          provincia: result.province,
                        });
                      }}
                      placeholder="Inizia a digitare per vedere i suggerimenti..."
                      data-testid="input-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Città *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={addressData.city}
                      onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                      data-testid="input-city" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="cap">CAP</Label>
                      <Input 
                        id="cap" 
                        name="cap" 
                        value={addressData.cap}
                        onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                        data-testid="input-cap" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Prov.</Label>
                      <Input 
                        id="provincia" 
                        name="provincia" 
                        maxLength={2}
                        value={addressData.provincia}
                        onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                        placeholder="XX"
                        data-testid="input-provincia" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codiceUnivoco">Codice Univoco (SDI)</Label>
                    <Input 
                      id="codiceUnivoco" 
                      name="codiceUnivoco" 
                      maxLength={7}
                      value={fiscalFields.codiceUnivoco}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                      placeholder="7 caratteri"
                      data-testid="input-codiceUnivoco" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pec">PEC</Label>
                    <Input 
                      id="pec" 
                      name="pec" 
                      type="email"
                      value={fiscalFields.pec}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, pec: e.target.value }))}
                      placeholder="email@pec.it"
                      data-testid="input-pec" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input 
                      id="iban" 
                      name="iban" 
                      value={fiscalFields.iban}
                      onChange={(e) => setFiscalFields(prev => ({ ...prev, iban: e.target.value }))}
                      placeholder="IT..."
                      data-testid="input-iban" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tariffa Manodopera
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tariffa Oraria (EUR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="35.00"
                      value={hourlyRateEuros}
                      onChange={(e) => setHourlyRateEuros(e.target.value)}
                      className="pl-7"
                      data-testid="input-hourly-rate"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tariffa oraria per il calcolo del costo manodopera nei preventivi. 
                    Se non specificata, verrà usata la tariffa globale del sistema.
                  </p>
                </div>
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
              <p className="text-sm mt-2">Clicca su "Nuovo Centro" per crearne uno</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Località</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Tariffa Oraria</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id} data-testid={`row-center-${center.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${center.id}`}>{center.name}</TableCell>
                    <TableCell data-testid={`text-location-${center.id}`}>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{center.city}</div>
                          <div className="text-xs text-muted-foreground">{center.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-contacts-${center.id}`}>
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
                    <TableCell data-testid={`text-hourly-rate-${center.id}`}>
                      {center.hourlyRateCents ? (
                        <span className="font-medium">€{(center.hourlyRateCents / 100).toFixed(2)}/ora</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"} data-testid={`badge-status-${center.id}`}>
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
                            setHourlyRateEuros(center.hourlyRateCents ? (center.hourlyRateCents / 100).toFixed(2) : "");
                            setFiscalFields({
                              ragioneSociale: center.ragioneSociale || "",
                              partitaIva: center.partitaIva || "",
                              codiceFiscale: center.codiceFiscale || "",
                              iban: center.iban || "",
                              codiceUnivoco: center.codiceUnivoco || "",
                              pec: center.pec || "",
                            });
                            setAddressData({
                              address: center.address || "",
                              city: center.city || "",
                              cap: center.cap || "",
                              provincia: center.provincia || "",
                            });
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-${center.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questo centro di riparazione?")) {
                              deleteCenterMutation.mutate(center.id);
                            }
                          }}
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
