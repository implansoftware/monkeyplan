import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { User, RepairOrder, SalesOrder, BillingData, UtilityPractice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
  Zap
} from "lucide-react";
import { getStatusConfig } from "@/lib/repair-status-config";

type EnrichedUtilityPractice = UtilityPractice & { 
  supplierName: string | null; 
  serviceName: string | null; 
};

interface CustomerDetailResponse {
  customer: User;
  reseller: { id: string; fullName: string } | null;
  repairOrders: RepairOrder[];
  salesOrders: SalesOrder[];
  billingData: BillingData | null;
  utilityPractices: EnrichedUtilityPractice[];
}

export default function AdminCustomerDetail() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
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
        <Link href="/admin/customers">
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

  const { customer, reseller, repairOrders, salesOrders, billingData, utilityPractices = [] } = data;

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/customers">
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
            {reseller && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Rivenditore Assegnato</p>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {reseller.fullName}
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
                            onClick={() => setLocation(`/admin/repairs/${order.id}`)}
                          >
                            <TableCell className="font-mono text-sm text-primary">
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
                              <Link href={`/admin/repairs/${order.id}`}>
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
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell className="font-mono">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/sales-orders/${order.id}`}>
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
                        <TableRow key={practice.id} data-testid={`row-utility-${practice.id}`}>
                          <TableCell className="font-mono">{practice.practiceNumber}</TableCell>
                          <TableCell>{practice.supplierName || practice.temporarySupplierName || "-"}</TableCell>
                          <TableCell>{practice.serviceName || practice.customServiceName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{practice.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(practice.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/utility/practices/${practice.id}`}>
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
    </div>
  );
}
