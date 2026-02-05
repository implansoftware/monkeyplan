import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { User, RepairOrder, SalesOrder, BillingData, UtilityPractice, RepairCenter } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerRelationshipsCard } from "@/components/CustomerRelationshipsCard";
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
  ShoppingCart, 
  FileText,
  Zap,
  UserCheck,
  Pencil,
  Check,
  ChevronRight,
  Key,
  MapPin,
  CreditCard,
  User as UserIcon
} from "lucide-react";
import { getStatusConfig } from "@/lib/repair-status-config";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type EnrichedUtilityPractice = UtilityPractice & { 
  supplierName: string | null; 
  serviceName: string | null; 
};

interface CustomerDetailResponse {
  customer: User;
  reseller: { id: string; fullName: string } | null;
  subReseller: { id: string; fullName: string } | null;
  repairOrders: RepairOrder[];
  salesOrders: SalesOrder[];
  billingData: BillingData | null;
  utilityPractices: EnrichedUtilityPractice[];
}

export default function ResellerCustomerDetail() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ["/api/reseller/customers", customerId],
    enabled: !!customerId,
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: Record<string, unknown>) => {
      const response = await apiRequest("PATCH", `/api/reseller/customers/${customerId}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
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
      <div className="space-y-6" data-testid="page-customer-detail-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-customer-detail-error">
        <Link href="/reseller/customers">
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

  const { customer, subReseller, repairOrders, salesOrders, billingData, utilityPractices = [] } = data;

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/reseller/customers">
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{repairOrders.length}</p>
                <p className="text-xs text-muted-foreground">Riparazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{salesOrders.length}</p>
                <p className="text-xs text-muted-foreground">Ordini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{utilityPractices.length}</p>
                <p className="text-xs text-muted-foreground">Pratiche Utility</p>
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
      </div>

      {/* Info Cards */}
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
            {subReseller && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sub-Reseller</p>
                  <p className="text-sm" data-testid="text-customer-sub-reseller">{subReseller.fullName}</p>
                </div>
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

      {/* Tabs */}
      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="repairs" className="text-xs gap-1.5" data-testid="tab-repairs">
            <Wrench className="h-3.5 w-3.5" />
            Riparazioni
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{repairOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs gap-1.5" data-testid="tab-orders">
            <ShoppingCart className="h-3.5 w-3.5" />
            Ordini
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{salesOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="utility" className="text-xs gap-1.5" data-testid="tab-utility">
            <Zap className="h-3.5 w-3.5" />
            Utility
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{utilityPractices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs gap-1.5" data-testid="tab-relationships">
            <UserCheck className="h-3.5 w-3.5" />
            Parentele
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repairs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {repairOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nessuna riparazione</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">ID</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Problema</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="pr-6 text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <TableRow key={order.id} data-testid={`row-repair-${order.id}`}>
                            <TableCell className="pl-6 font-mono text-sm">
                              {order.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{order.brand}</span>
                              <span className="text-muted-foreground ml-1">{order.deviceModel}</span>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-muted-foreground">
                              {order.issueDescription}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                className="font-normal"
                                style={{ 
                                  backgroundColor: statusConfig.color + "15",
                                  color: statusConfig.color 
                                }}
                              >
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), "dd/MM/yy")}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <Link href={`/reseller/repairs/${order.id}`}>
                                <Button variant="ghost" size="sm" className="h-8" data-testid={`button-view-repair-${order.id}`}>
                                  Dettagli
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {salesOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nessun ordine</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Ordine</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Totale</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="pr-6 text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map((order) => (
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell className="pl-6 font-mono">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">{order.status}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            €{Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Link href={`/reseller/sales-orders/${order.id}`}>
                              <Button variant="ghost" size="sm" className="h-8" data-testid={`button-view-order-${order.id}`}>
                                Dettagli
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utility" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {utilityPractices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nessuna pratica utility</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Pratica</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead>Servizio</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="pr-6 text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {utilityPractices.map((practice) => (
                        <TableRow key={practice.id} data-testid={`row-utility-${practice.id}`}>
                          <TableCell className="pl-6 font-mono">{practice.practiceNumber}</TableCell>
                          <TableCell>{practice.supplierName || practice.temporarySupplierName || "-"}</TableCell>
                          <TableCell>{practice.serviceName || practice.customServiceName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">{practice.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(practice.createdAt), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Link href={`/reseller/utility/practices/${practice.id}`}>
                              <Button variant="ghost" size="sm" className="h-8" data-testid={`button-view-utility-${practice.id}`}>
                                Dettagli
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="mt-4">
          <CustomerRelationshipsCard customerId={customerId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
          </DialogHeader>
          <CustomerEditForm
            customer={customer}
            billingData={billingData}
            repairCenters={repairCenters}
            onSave={(formData) => updateCustomerMutation.mutate(formData)}
            onCancel={() => setEditDialogOpen(false)}
            isPending={updateCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type CustomerWithRepairCenters = User & {
  assignedRepairCenters?: RepairCenter[];
};

function CustomerEditForm({
  customer,
  billingData,
  repairCenters,
  onSave,
  onCancel,
  isPending,
}: {
  customer: CustomerWithRepairCenters;
  billingData?: BillingData;
  repairCenters: RepairCenter[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    username: customer.username,
    email: customer.email,
    phone: customer.phone || "",
    isActive: customer.isActive,
    repairCenterIds: customer.assignedRepairCenters?.map(rc => rc.id) || [],
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

  const toggleRepairCenter = (centerId: string) => {
    setFormData(prev => ({
      ...prev,
      repairCenterIds: prev.repairCenterIds.includes(centerId)
        ? prev.repairCenterIds.filter(id => id !== centerId)
        : [...prev.repairCenterIds, centerId],
    }));
  };

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
      {/* Account Section */}
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
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              data-testid="input-edit-username"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex flex-wrap items-center gap-2">
            <Key className="h-3 w-3" />
            Nuova Password (lascia vuoto per non cambiare)
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimo 6 caratteri"
            data-testid="input-edit-password"
          />
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

      {/* Billing Section */}
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

        <div className="space-y-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input
            id="iban"
            value={formData.billingData.iban}
            onChange={(e) => updateBilling("iban", e.target.value)}
            data-testid="input-edit-iban"
          />
        </div>
      </div>

      {/* Address Section */}
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

      {/* Repair Centers */}
      {repairCenters.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <Label>Centri Riparazione</Label>
          <div className="flex flex-wrap gap-2">
            {repairCenters.map((rc) => {
              const isSelected = formData.repairCenterIds.includes(rc.id);
              return (
                <Badge
                  key={rc.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRepairCenter(rc.id)}
                  data-testid={`badge-edit-repair-center-${rc.id}`}
                >
                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                  {rc.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

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
