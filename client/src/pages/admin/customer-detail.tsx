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
  Zap,
  MapPin,
  CreditCard,
  Activity
} from "lucide-react";
import { getStatusConfig } from "@/lib/repair-status-config";

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
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-customer-detail-error">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4" />
            Torna ai clienti
          </Button>
        </Link>
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 text-lg">Cliente non trovato</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, reseller, subReseller, repairOrders, salesOrders, billingData, utilityPractices = [] } = data;

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10">
          <Link href="/admin/customers">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back-to-customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai clienti
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="text-customer-name">
                  {customer.fullName}
                </h1>
                <p className="text-cyan-100/80 mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </p>
              </div>
            </div>
            <Badge 
              className={customer.isActive 
                ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 px-4 py-2" 
                : "bg-slate-400/20 text-slate-100 border border-slate-400/30 px-4 py-2"
              } 
              data-testid="badge-customer-status"
            >
              <Activity className="h-4 w-4 mr-2" />
              {customer.isActive ? "Attivo" : "Inattivo"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              Informazioni Personali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Username</p>
                <p className="font-semibold text-slate-900 dark:text-white font-mono" data-testid="text-customer-username">{customer.username}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Data Registrazione</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-customer-created">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {format(new Date(customer.createdAt), "dd MMM yyyy", { locale: it })}
                </p>
              </div>
            </div>
            
            {customer.phone && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telefono</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-customer-phone">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  {customer.phone}
                </p>
              </div>
            )}
            
            {reseller && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Rivenditore Assegnato</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-customer-reseller">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  {reseller.fullName}
                </p>
              </div>
            )}
            
            {subReseller && (
              <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
                <p className="text-xs text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">Sub-Reseller Assegnato</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-customer-sub-reseller">
                  <Building2 className="h-4 w-4 text-violet-500" />
                  {subReseller.fullName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {billingData ? (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Dati di Fatturazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {billingData.companyName && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ragione Sociale</p>
                  <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-billing-company">{billingData.companyName}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingData.fiscalCode && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Codice Fiscale</p>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm" data-testid="text-billing-cf">{billingData.fiscalCode}</p>
                  </div>
                )}
                {billingData.vatNumber && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Partita IVA</p>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm" data-testid="text-billing-piva">{billingData.vatNumber}</p>
                  </div>
                )}
              </div>
              
              {billingData.address && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Indirizzo</p>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-billing-address">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    {billingData.address}
                    {billingData.zipCode && `, ${billingData.zipCode}`}
                    {billingData.city && ` ${billingData.city}`}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingData.pec && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">PEC</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate" data-testid="text-billing-pec">{billingData.pec}</p>
                  </div>
                )}
                {billingData.codiceUnivoco && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Codice SDI</p>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono" data-testid="text-billing-sdi">{billingData.codiceUnivoco}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Dati di Fatturazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Nessun dato di fatturazione disponibile</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <Tabs defaultValue="repairs" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <TabsTrigger value="repairs" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-repairs">
                <Wrench className="h-4 w-4" />
                Riparazioni ({repairOrders.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-orders">
                <ShoppingCart className="h-4 w-4" />
                Ordini ({salesOrders.length})
              </TabsTrigger>
              <TabsTrigger value="utility" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-utility">
                <Zap className="h-4 w-4" />
                Utility ({utilityPractices.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="repairs" className="px-6 pb-6">
            {repairOrders.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessuna riparazione trovata</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">ID</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Dispositivo</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Problema</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Data</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <TableRow 
                          key={order.id} 
                          data-testid={`row-repair-${order.id}`}
                          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          onClick={() => setLocation(`/admin/repairs/${order.id}`)}
                        >
                          <TableCell className="font-mono text-sm text-blue-600">
                            {order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {order.brand} {order.deviceModel}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-slate-500">
                            {order.issueDescription}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="text-xs"
                              style={{ 
                                backgroundColor: statusConfig.color + "20",
                                color: statusConfig.color 
                              }}
                            >
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/repairs/${order.id}`}>
                              <Button size="icon" variant="ghost" className="hover:bg-blue-100 hover:text-blue-600" data-testid={`button-view-repair-${order.id}`}>
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
          </TabsContent>

          <TabsContent value="orders" className="px-6 pb-6">
            {salesOrders.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessun ordine trovato</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Numero Ordine</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Totale</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Data</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        data-testid={`row-order-${order.id}`}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        onClick={() => setLocation(`/admin/sales-orders/${order.id}`)}
                      >
                        <TableCell className="font-mono text-blue-600">{order.orderNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {Number(order.total).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/sales-orders/${order.id}`}>
                            <Button size="icon" variant="ghost" className="hover:bg-blue-100 hover:text-blue-600" data-testid={`button-view-order-${order.id}`}>
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
          </TabsContent>

          <TabsContent value="utility" className="px-6 pb-6">
            {utilityPractices.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                <Zap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessuna pratica utility trovata</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Numero Pratica</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Fornitore</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Servizio</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Data</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilityPractices.map((practice) => (
                      <TableRow 
                        key={practice.id} 
                        data-testid={`row-utility-${practice.id}`}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        onClick={() => setLocation(`/admin/utility/practices/${practice.id}`)}
                      >
                        <TableCell className="font-mono text-amber-600">{practice.practiceNumber}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{practice.supplierName || practice.temporarySupplierName || "-"}</TableCell>
                        <TableCell className="text-slate-500">{practice.serviceName || practice.customServiceName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{practice.status}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {format(new Date(practice.createdAt), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/utility/practices/${practice.id}`}>
                            <Button size="icon" variant="ghost" className="hover:bg-amber-100 hover:text-amber-600" data-testid={`button-view-utility-${practice.id}`}>
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
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
