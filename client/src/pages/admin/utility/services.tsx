import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilityService, InsertUtilityService, UtilitySupplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, Package, Pencil, Trash2, 
  ArrowLeft, Building2, Euro, Clock
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type ServiceCategory = "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro";

const categoryLabels: Record<ServiceCategory, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

const categoryColors: Record<ServiceCategory, string> = {
  fisso: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  mobile: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  centralino: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  luce: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  gas: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  altro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const formatCurrency = (cents: number | null) => {
  if (cents === null) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function AdminUtilityServices() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<UtilityService | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("fisso");
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilityService) => {
      const res = await apiRequest("POST", "/api/utility/services", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/services"] });
      setDialogOpen(false);
      setEditingService(null);
      toast({ title: t("utility.serviceCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilityService> }) => {
      const res = await apiRequest("PATCH", `/api/utility/services/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/services"] });
      setDialogOpen(false);
      setEditingService(null);
      toast({ title: t("utility.serviceUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/services"] });
      toast({ title: t("utility.serviceDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const monthlyPrice = formData.get("monthlyPriceCents") as string;
    const activationFee = formData.get("activationFeeCents") as string;
    const commissionPercent = formData.get("commissionPercent") as string;
    const commissionFixed = formData.get("commissionFixed") as string;
    const commissionOneTime = formData.get("commissionOneTime") as string;
    const contractMonths = formData.get("contractMonths") as string;
    
    const data: InsertUtilityService = {
      supplierId: selectedSupplierId,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      category: selectedCategory,
      monthlyPriceCents: monthlyPrice ? Math.round(parseFloat(monthlyPrice) * 100) : null,
      activationFeeCents: activationFee ? Math.round(parseFloat(activationFee) * 100) : null,
      commissionPercent: commissionPercent ? parseFloat(commissionPercent) : null,
      commissionFixed: commissionFixed ? Math.round(parseFloat(commissionFixed) * 100) : null,
      commissionOneTime: commissionOneTime ? Math.round(parseFloat(commissionOneTime) * 100) : null,
      contractMonths: contractMonths && contractMonths.trim() !== "" ? parseInt(contractMonths) : null,
      isActive: isActive,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: UtilityService) => {
    setEditingService(service);
    setSelectedSupplierId(service.supplierId);
    setSelectedCategory(service.category);
    setIsActive(service.isActive);
    setDialogOpen(true);
  };

  const handleNewService = () => {
    setEditingService(null);
    setSelectedSupplierId("");
    setSelectedCategory("fisso");
    setIsActive(true);
    setDialogOpen(true);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = supplierFilter === "all" || service.supplierId === supplierFilter;
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/utility">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Listino Servizi Utility</h1>
              <p className="text-sm text-muted-foreground">Gestisci il catalogo servizi dei fornitori</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-services"
              />
            </div>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-40" data-testid="select-supplier-filter">
                <SelectValue placeholder={t("suppliers.supplier")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("suppliers.allSuppliers")}</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32" data-testid="select-category-filter">
                <SelectValue placeholder={t("utility.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewService} data-testid="button-new-service">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Servizio
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessun servizio trovato</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aggiungi servizi al listino per utilizzarli nelle pratiche
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.code")}</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("suppliers.supplier")}</TableHead>
                  <TableHead>{t("common.category")}</TableHead>
                  <TableHead>{t("utility.monthlyPrice")}</TableHead>
                  <TableHead>{t("utility.activationCost")}</TableHead>
                  <TableHead>{t("utility.commission")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const supplier = suppliers.find(s => s.id === service.supplierId);
                  return (
                    <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                      <TableCell className="font-mono text-sm">
                        {service.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        {supplier ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {supplier.name}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[service.category]}>
                          {categoryLabels[service.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(service.monthlyPriceCents)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(service.activationFeeCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-sm">
                          {service.commissionPercent && (
                            <span>{service.commissionPercent}%</span>
                          )}
                          {service.commissionFixed && (
                            <span className="flex flex-wrap items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {formatCurrency(service.commissionFixed)}
                            </span>
                          )}
                          {!service.commissionPercent && !service.commissionFixed && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(service)}
                            data-testid={`button-edit-${service.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questo servizio?")) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                            data-testid={`button-delete-${service.id}`}
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
              {editingService ? "Modifica Servizio" : "Nuovo Servizio Utility"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Modifica i dettagli del servizio."
                : "Aggiungi un nuovo servizio al listino."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">{t("suppliers.supplier")} *</Label>
                <Select 
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                  required
                >
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder={t("suppliers.selectSupplier")} />
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
                <Label htmlFor="category">{t("utility.category")} *</Label>
                <Select 
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v as ServiceCategory)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("common.code")} *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  defaultValue={editingService?.code || ""}
                  placeholder="es. TIM-FIBRA-1000"
                  data-testid="input-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Servizio *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingService?.name || ""}
                  placeholder="es. Fibra 1000 Mega"
                  data-testid="input-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={editingService?.description || ""}
                placeholder={t("utility.serviceDescription")}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPriceCents">Prezzo Mensile (EUR)</Label>
                <Input
                  id="monthlyPriceCents"
                  name="monthlyPriceCents"
                  type="number"
                  step="0.01"
                  defaultValue={editingService?.monthlyPriceCents 
                    ? (editingService.monthlyPriceCents / 100).toFixed(2) 
                    : ""}
                  placeholder="29.90"
                  data-testid="input-monthly-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activationFeeCents">Costo Attivazione (EUR)</Label>
                <Input
                  id="activationFeeCents"
                  name="activationFeeCents"
                  type="number"
                  step="0.01"
                  defaultValue={editingService?.activationFeeCents 
                    ? (editingService.activationFeeCents / 100).toFixed(2) 
                    : ""}
                  placeholder="49.00"
                  data-testid="input-activation-fee"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionPercent">Commissione %</Label>
                <Input
                  id="commissionPercent"
                  name="commissionPercent"
                  type="number"
                  step="0.1"
                  defaultValue={editingService?.commissionPercent || ""}
                  placeholder="10"
                  data-testid="input-commission-percent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionFixed">Commissione Fissa (EUR)</Label>
                <Input
                  id="commissionFixed"
                  name="commissionFixed"
                  type="number"
                  step="0.01"
                  defaultValue={editingService?.commissionFixed 
                    ? (editingService.commissionFixed / 100).toFixed(2) 
                    : ""}
                  placeholder="50.00"
                  data-testid="input-commission-fixed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionOneTime">Una Tantum (EUR)</Label>
                <Input
                  id="commissionOneTime"
                  name="commissionOneTime"
                  type="number"
                  step="0.01"
                  defaultValue={editingService?.commissionOneTime 
                    ? (editingService.commissionOneTime / 100).toFixed(2) 
                    : ""}
                  placeholder="100.00"
                  data-testid="input-commission-onetime"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractMonths">Durata Contratto (mesi)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contractMonths"
                    name="contractMonths"
                    type="number"
                    defaultValue={editingService?.contractMonths ?? ""}
                    placeholder="es. 24"
                    data-testid="input-contract-months"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <div className="flex flex-wrap items-center gap-2 h-9">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    data-testid="switch-active"
                  />
                  <span className="text-sm">
                    {isActive ? "Attivo" : "Inattivo"}
                  </span>
                </div>
              </div>
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
                {editingService ? "Salva Modifiche" : "Crea Servizio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
