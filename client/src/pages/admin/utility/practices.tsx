import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilityPractice, InsertUtilityPractice, UtilitySupplier, UtilityService, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, FileCheck, Pencil, Trash2, 
  ArrowLeft, User as UserIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";

const statusLabels: Record<PracticeStatus, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  attesa_documenti: "Attesa Documenti",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const statusColors: Record<PracticeStatus, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const categoryLabels: Record<string, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function AdminUtilityPractices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<UtilityPractice | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<PracticeStatus>("bozza");
  const { toast } = useToast();

  const { data: practices = [], isLoading } = useQuery<UtilityPractice[]>({
    queryKey: ["/api/utility/practices"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const { data: services = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services", selectedSupplierId],
    queryFn: async () => {
      const url = selectedSupplierId 
        ? `/api/utility/services?supplierId=${selectedSupplierId}`
        : "/api/utility/services";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedSupplierId,
  });
  
  const { data: allServices = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilityPractice) => {
      const res = await apiRequest("POST", "/api/utility/practices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilityPractice> }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      toast({ title: "Pratica eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertUtilityPractice = {
      supplierId: formData.get("supplierId") as string,
      serviceId: formData.get("serviceId") as string,
      customerId: formData.get("customerId") as string,
      supplierReference: formData.get("supplierReference") as string || undefined,
      status: selectedStatus,
      monthlyPriceCents: formData.get("monthlyPriceCents") 
        ? Math.round(parseFloat(formData.get("monthlyPriceCents") as string) * 100) 
        : undefined,
      commissionAmountCents: formData.get("commissionAmountCents")
        ? Math.round(parseFloat(formData.get("commissionAmountCents") as string) * 100)
        : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    if (editingPractice) {
      updateMutation.mutate({ id: editingPractice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (practice: UtilityPractice) => {
    setEditingPractice(practice);
    setSelectedSupplierId(practice.supplierId);
    setSelectedStatus(practice.status);
    setDialogOpen(true);
  };

  const handleNewPractice = () => {
    setEditingPractice(null);
    setSelectedSupplierId("");
    setSelectedStatus("bozza");
    setDialogOpen(true);
  };

  const filteredPractices = practices.filter((practice) => {
    const matchesSearch = practice.practiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (practice.supplierReference && practice.supplierReference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || practice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customerUsers = customers.filter(u => u.role === "customer");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/utility">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pratiche Utility</h1>
            <p className="text-muted-foreground">
              Gestisci contratti e pratiche di servizi utility
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero pratica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-practices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewPractice} data-testid="button-new-practice">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Pratica
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessuna pratica trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Pratica</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Servizio</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractices.map((practice) => {
                  const supplier = suppliers.find(s => s.id === practice.supplierId);
                  const service = allServices.find(s => s.id === practice.serviceId);
                  const customer = customers.find(c => c.id === practice.customerId);
                  return (
                    <TableRow key={practice.id} data-testid={`row-practice-${practice.id}`}>
                      <TableCell className="font-medium">
                        {practice.practiceNumber}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            {customer.fullName}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {supplier ? (
                          <Badge variant="outline">{supplier.name}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {service ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {categoryLabels[service.category]}
                            </span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {practice.monthlyPriceCents 
                          ? formatCurrency(practice.monthlyPriceCents) + "/mese"
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[practice.status]}>
                          {statusLabels[practice.status] || practice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(practice)}
                            data-testid={`button-edit-${practice.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questa pratica?")) {
                                deleteMutation.mutate(practice.id);
                              }
                            }}
                            data-testid={`button-delete-${practice.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPractice ? "Modifica Pratica" : "Nuova Pratica Utility"}
            </DialogTitle>
            <DialogDescription>
              {editingPractice 
                ? "Modifica i dati della pratica."
                : "Crea una nuova pratica di servizio utility."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Fornitore *</Label>
                <Select 
                  name="supplierId" 
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                  required
                >
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Seleziona fornitore" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.isActive).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servizio *</Label>
                <Select 
                  name="serviceId" 
                  defaultValue={editingPractice?.serviceId}
                  disabled={!selectedSupplierId}
                  required
                >
                  <SelectTrigger data-testid="select-service">
                    <SelectValue placeholder="Seleziona servizio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.isActive).map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({categoryLabels[service.category]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <Select 
                name="customerId" 
                defaultValue={editingPractice?.customerId}
                required
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customerUsers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierReference">Riferimento Fornitore</Label>
                <Input
                  id="supplierReference"
                  name="supplierReference"
                  defaultValue={editingPractice?.supplierReference || ""}
                  placeholder="Codice pratica fornitore"
                  data-testid="input-supplier-reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select 
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as PracticeStatus)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPriceCents">Prezzo Mensile (EUR)</Label>
                <Input
                  id="monthlyPriceCents"
                  name="monthlyPriceCents"
                  type="number"
                  step="0.01"
                  defaultValue={editingPractice?.monthlyPriceCents 
                    ? (editingPractice.monthlyPriceCents / 100).toFixed(2) 
                    : ""}
                  data-testid="input-monthly-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionAmountCents">Commissione (EUR)</Label>
                <Input
                  id="commissionAmountCents"
                  name="commissionAmountCents"
                  type="number"
                  step="0.01"
                  defaultValue={editingPractice?.commissionAmountCents 
                    ? (editingPractice.commissionAmountCents / 100).toFixed(2) 
                    : ""}
                  data-testid="input-commission"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingPractice?.notes || ""}
                data-testid="input-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingPractice ? "Salva Modifiche" : "Crea Pratica"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
