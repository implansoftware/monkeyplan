import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { User, RepairOrder, BillingData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Wrench, 
  FileText,
  Pencil,
  Key,
  MapPin,
  CreditCard,
  User as UserIcon,
  ChevronRight
} from "lucide-react";
import { getStatusConfig } from "@/lib/repair-status-config";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomerDetailResponse extends User {
  repairs?: RepairOrder[];
}

export default function RepairCenterCustomerDetail() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: customer, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ["/api/repair-center/customers", customerId],
    enabled: !!customerId,
  });

  const { data: billingData } = useQuery<BillingData | null>({
    queryKey: ["/api/billing-data", customerId],
    enabled: !!customerId,
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: Record<string, unknown>) => {
      const response = await apiRequest("PATCH", `/api/repair-center/customers/${customerId}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing-data", customerId] });
      setEditDialogOpen(false);
      toast({
        title: "Cliente aggiornato",
        description: "I dati del cliente sono stati salvati correttamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il cliente",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="page-customer-detail-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 space-y-6" data-testid="page-customer-detail-error">
        <Link href="/repair-center/customers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clienti
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Cliente non trovato</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const repairs = customer.repairs || [];

  return (
    <div className="p-6 space-y-6" data-testid="page-customer-detail">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/repair-center/customers">
          <Button variant="ghost" size="sm" className="w-fit" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Clienti
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-customer-name">
              {customer.fullName}
            </h1>
            <Badge variant={customer.isActive ? "outline" : "secondary"} className="font-normal" data-testid="badge-customer-status">
              {customer.isActive ? "Attivo" : "Inattivo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">@{customer.username}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} data-testid="button-edit-customer">
          <Pencil className="h-4 w-4 mr-2" />
          Modifica
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{repairs.length}</p>
                <p className="text-xs text-muted-foreground">Riparazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {billingData ? "1" : "0"}
                </p>
                <p className="text-xs text-muted-foreground">Dati Fatt.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {billingData?.customerType === "company" ? "Azienda" : "Privato"}
                </p>
                <p className="text-xs text-muted-foreground">Tipo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contatti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm" data-testid="text-customer-email">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex flex-wrap items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm" data-testid="text-customer-phone">{customer.phone}</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Registrato il</p>
              <p className="text-sm" data-testid="text-customer-created">
                {format(new Date(customer.createdAt), "dd MMMM yyyy", { locale: it })}
              </p>
            </div>
          </CardContent>
        </Card>

        {billingData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Fatturazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {billingData.companyName && (
                <div>
                  <p className="text-xs text-muted-foreground">Ragione Sociale</p>
                  <p data-testid="text-billing-company">{billingData.companyName}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingData.fiscalCode && (
                  <div>
                    <p className="text-xs text-muted-foreground">C.F.</p>
                    <p className="font-mono" data-testid="text-billing-cf">{billingData.fiscalCode}</p>
                  </div>
                )}
                {billingData.vatNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">P.IVA</p>
                    <p className="font-mono" data-testid="text-billing-piva">{billingData.vatNumber}</p>
                  </div>
                )}
              </div>
              {billingData.address && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Indirizzo</p>
                  <p data-testid="text-billing-address">
                    {billingData.address}
                    {billingData.zipCode && `, ${billingData.zipCode}`}
                    {billingData.city && ` ${billingData.city}`}
                  </p>
                </div>
              )}
              {(billingData.pec || billingData.codiceUnivoco) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                  {billingData.pec && (
                    <div>
                      <p className="text-xs text-muted-foreground">PEC</p>
                      <p className="truncate" data-testid="text-billing-pec">{billingData.pec}</p>
                    </div>
                  )}
                  {billingData.codiceUnivoco && (
                    <div>
                      <p className="text-xs text-muted-foreground">SDI</p>
                      <p className="font-mono" data-testid="text-billing-sdi">{billingData.codiceUnivoco}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList>
          <TabsTrigger value="repairs">Riparazioni ({repairs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="repairs" className="mt-4">
          {repairs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Nessuna riparazione</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair) => {
                    const statusConfig = getStatusConfig(repair.status);
                    return (
                      <TableRow key={repair.id}>
                        <TableCell className="font-mono text-xs">{repair.orderNumber}</TableCell>
                        <TableCell>
                          {repair.brand} {repair.deviceModel}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(repair.createdAt), "dd/MM/yy", { locale: it })}
                        </TableCell>
                        <TableCell>
                          <Link href={`/repair-center/repairs/${repair.id}`}>
                            <Button variant="ghost" size="icon">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
          </DialogHeader>
          <CustomerEditForm
            customer={customer}
            billingData={billingData || undefined}
            onSave={(formData) => updateCustomerMutation.mutate(formData)}
            onCancel={() => setEditDialogOpen(false)}
            isPending={updateCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerEditForm({
  customer,
  billingData,
  onSave,
  onCancel,
  isPending,
}: {
  customer: User;
  billingData?: BillingData;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || "",
    isActive: customer.isActive,
    password: "",
    billingData: {
      customerType: billingData?.customerType || "private",
      companyName: billingData?.companyName || "",
      vatNumber: billingData?.vatNumber || "",
      fiscalCode: billingData?.fiscalCode || "",
      pec: billingData?.pec || "",
      codiceUnivoco: billingData?.codiceUnivoco || "",
      iban: billingData?.iban || "",
      address: billingData?.address || "",
      city: billingData?.city || "",
      zipCode: billingData?.zipCode || "",
      country: billingData?.country || "IT",
    },
  });

  const isCompany = formData.billingData.customerType === "company";

  const updateBilling = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingData: { ...prev.billingData, [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...formData,
      password: formData.password || undefined,
    };
    if (!formData.password) delete payload.password;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          Dati Account
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              data-testid="input-edit-fullName"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-edit-email"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-edit-phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex flex-wrap items-center gap-2">
              <Key className="h-3 w-3" />
              Nuova Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Lascia vuoto per non cambiare"
              data-testid="input-edit-password"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="isActive">Cliente Attivo</Label>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="input-edit-isActive"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          Dati Fatturazione
        </div>
        <div className="flex gap-4">
          <Label className="flex flex-wrap items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              checked={!isCompany}
              onChange={() => updateBilling("customerType", "private")}
              data-testid="radio-private"
            />
            Privato
          </Label>
          <Label className="flex flex-wrap items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              checked={isCompany}
              onChange={() => updateBilling("customerType", "company")}
              data-testid="radio-company"
            />
            Azienda
          </Label>
        </div>

        {isCompany && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Ragione Sociale</Label>
              <Input
                id="companyName"
                value={formData.billingData.companyName}
                onChange={(e) => updateBilling("companyName", e.target.value)}
                data-testid="input-edit-companyName"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatNumber">P.IVA</Label>
                <Input
                  id="vatNumber"
                  value={formData.billingData.vatNumber}
                  onChange={(e) => updateBilling("vatNumber", e.target.value)}
                  data-testid="input-edit-vatNumber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                <Input
                  id="fiscalCode"
                  value={formData.billingData.fiscalCode}
                  onChange={(e) => updateBilling("fiscalCode", e.target.value)}
                  data-testid="input-edit-fiscalCode"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pec">PEC</Label>
                <Input
                  id="pec"
                  type="email"
                  value={formData.billingData.pec}
                  onChange={(e) => updateBilling("pec", e.target.value)}
                  data-testid="input-edit-pec"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codiceUnivoco">Codice Univoco SDI</Label>
                <Input
                  id="codiceUnivoco"
                  value={formData.billingData.codiceUnivoco}
                  onChange={(e) => updateBilling("codiceUnivoco", e.target.value)}
                  maxLength={7}
                  data-testid="input-edit-codiceUnivoco"
                />
              </div>
            </div>
          </>
        )}

        {!isCompany && (
          <div className="space-y-2">
            <Label htmlFor="fiscalCode">Codice Fiscale</Label>
            <Input
              id="fiscalCode"
              value={formData.billingData.fiscalCode}
              onChange={(e) => updateBilling("fiscalCode", e.target.value)}
              data-testid="input-edit-fiscalCode-private"
            />
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Indirizzo
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Via/Piazza</Label>
          <Input
            id="address"
            value={formData.billingData.address}
            onChange={(e) => updateBilling("address", e.target.value)}
            data-testid="input-edit-address"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Città</Label>
            <Input
              id="city"
              value={formData.billingData.city}
              onChange={(e) => updateBilling("city", e.target.value)}
              data-testid="input-edit-city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">CAP</Label>
            <Input
              id="zipCode"
              value={formData.billingData.zipCode}
              onChange={(e) => updateBilling("zipCode", e.target.value)}
              data-testid="input-edit-zipCode"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Paese</Label>
            <Input
              id="country"
              value={formData.billingData.country}
              onChange={(e) => updateBilling("country", e.target.value)}
              data-testid="input-edit-country"
            />
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </DialogFooter>
    </form>
  );
}
