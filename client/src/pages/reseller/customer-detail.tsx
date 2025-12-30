import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { User, RepairOrder, SalesOrder, BillingData, UtilityPractice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  Wrench, 
  ShoppingCart, 
  FileText,
  Calendar,
  Eye,
  Zap,
  UserCheck,
  Pencil
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
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: Record<string, unknown>) => {
      const response = await apiRequest("PATCH", `/api/reseller/customers/${customerId}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-customer-detail-error">
        <Link href="/reseller/customers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai clienti
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Cliente non trovato
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, subReseller, repairOrders, salesOrders, billingData, utilityPractices = [] } = data;

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/reseller/customers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai clienti
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-customer-name">
            {customer.fullName}
          </h1>
          <p className="text-muted-foreground">Dettagli cliente</p>
        </div>
        <Badge variant={customer.isActive ? "default" : "secondary"} data-testid="badge-customer-status">
          {customer.isActive ? "Attivo" : "Inattivo"}
        </Badge>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setEditDialogOpen(true)}
          data-testid="button-edit-customer"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Modifica
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Informazioni Personali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium" data-testid="text-customer-username">{customer.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-customer-email">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.email}
                </p>
              </div>
              {customer.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium flex items-center gap-2" data-testid="text-customer-phone">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {customer.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data Registrazione</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-customer-created">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(customer.createdAt), "dd MMMM yyyy", { locale: it })}
                </p>
              </div>
            </div>
            {subReseller && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Sub-Reseller Assegnato</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-customer-sub-reseller">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  {subReseller.fullName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {billingData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dati di Fatturazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {billingData.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                  <p className="font-medium" data-testid="text-billing-company">{billingData.companyName}</p>
                </div>
              )}
              {billingData.fiscalCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                  <p className="font-medium" data-testid="text-billing-cf">{billingData.fiscalCode}</p>
                </div>
              )}
              {billingData.vatNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Partita IVA</p>
                  <p className="font-medium" data-testid="text-billing-piva">{billingData.vatNumber}</p>
                </div>
              )}
              {billingData.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Indirizzo</p>
                  <p className="font-medium" data-testid="text-billing-address">
                    {billingData.address}
                    {billingData.zipCode && `, ${billingData.zipCode}`}
                    {billingData.city && ` ${billingData.city}`}
                  </p>
                </div>
              )}
              {billingData.pec && (
                <div>
                  <p className="text-sm text-muted-foreground">PEC</p>
                  <p className="font-medium" data-testid="text-billing-pec">{billingData.pec}</p>
                </div>
              )}
              {billingData.codiceUnivoco && (
                <div>
                  <p className="text-sm text-muted-foreground">Codice Destinatario (SDI)</p>
                  <p className="font-medium" data-testid="text-billing-sdi">{billingData.codiceUnivoco}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList>
          <TabsTrigger value="repairs" className="gap-2" data-testid="tab-repairs">
            <Wrench className="h-4 w-4" />
            Riparazioni ({repairOrders.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4" />
            Ordini ({salesOrders.length})
          </TabsTrigger>
          <TabsTrigger value="utility" className="gap-2" data-testid="tab-utility">
            <Zap className="h-4 w-4" />
            Pratiche Utility ({utilityPractices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repairs">
          <Card>
            <CardContent className="p-0">
              {repairOrders.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nessuna riparazione trovata
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Problema</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data Creazione</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <TableRow 
                            key={order.id} 
                            data-testid={`row-repair-${order.id}`}
                            className="cursor-pointer hover-elevate"
                            onClick={() => setLocation(`/reseller/repairs/${order.id}`)}
                          >
                            <TableCell className="font-mono text-sm underline-offset-4 hover:underline">
                              {order.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              {order.brand} {order.deviceModel}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {order.issueDescription}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                style={{ 
                                  backgroundColor: statusConfig.color + "20",
                                  color: statusConfig.color 
                                }}
                              >
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/reseller/repairs/${order.id}`}>
                                <Button size="icon" variant="ghost" data-testid={`button-view-repair-${order.id}`}>
                                  <Eye className="h-4 w-4" />
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

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              {salesOrders.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nessun ordine trovato
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero Ordine</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Totale</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map((order) => (
                        <TableRow 
                          key={order.id} 
                          data-testid={`row-order-${order.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setLocation(`/reseller/sales-orders/${order.id}`)}
                        >
                          <TableCell className="font-mono underline-offset-4 hover:underline">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            €{Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/reseller/sales-orders/${order.id}`}>
                              <Button size="icon" variant="ghost" data-testid={`button-view-order-${order.id}`}>
                                <Eye className="h-4 w-4" />
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

        <TabsContent value="utility">
          <Card>
            <CardContent className="p-0">
              {utilityPractices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nessuna pratica utility trovata
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero Pratica</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead>Servizio</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {utilityPractices.map((practice) => (
                        <TableRow 
                          key={practice.id} 
                          data-testid={`row-utility-${practice.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setLocation(`/reseller/utility/practices/${practice.id}`)}
                        >
                          <TableCell className="font-mono underline-offset-4 hover:underline">{practice.practiceNumber}</TableCell>
                          <TableCell>{practice.supplierName || practice.temporarySupplierName || "-"}</TableCell>
                          <TableCell>{practice.serviceName || practice.customServiceName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{practice.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(practice.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/reseller/utility/practices/${practice.id}`}>
                              <Button size="icon" variant="ghost" data-testid={`button-view-utility-${practice.id}`}>
                                <Eye className="h-4 w-4" />
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
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
            <DialogDescription>
              Modifica i dati del cliente {customer.fullName}
            </DialogDescription>
          </DialogHeader>
          <CustomerEditForm
            customer={customer}
            billingData={billingData}
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
  billingData: BillingData | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || "",
    isActive: customer.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nome Completo
        </label>
        <input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
          data-testid="input-edit-fullName"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
          data-testid="input-edit-email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Telefono
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="input-edit-phone"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          data-testid="input-edit-isActive"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Cliente attivo
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
          Annulla
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-edit">
          {isPending ? "Salvataggio..." : "Salva"}
        </Button>
      </div>
    </form>
  );
}
