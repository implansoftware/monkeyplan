import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { RepairCenter, RepairOrder, User, UtilityPractice } from "@shared/schema";
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
  Store, 
  Mail, 
  Phone, 
  Building2, 
  Users,
  Wrench,
  Package,
  MapPin,
  FileText,
  TrendingUp,
  Calendar,
  Eye,
  FileCheck
} from "lucide-react";

type SafeUser = Omit<User, 'password'>;

interface RepairCenterPurchaseOrder {
  id: string;
  orderNumber: string;
  repairCenterId: string;
  resellerId: string;
  status: string;
  totalAmountCents: number;
  createdAt: string;
}

interface RepairCenterOverviewResponse {
  center: RepairCenter;
  reseller: SafeUser | null;
  subReseller: SafeUser | null;
  repairs: RepairOrder[];
  b2bOrders: RepairCenterPurchaseOrder[];
  customers: SafeUser[];
  staff: SafeUser[];
  stats: {
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    repairs30Days: number;
    totalCustomers: number;
    totalStaff: number;
    totalB2bOrders: number;
    totalUtilityPractices: number;
  };
  usersMap: Record<string, { id: string; fullName: string }>;
  utilityPractices: UtilityPractice[];
  suppliersMap: Record<string, string>;
  servicesMap: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  accettazione: "Accettazione",
  diagnosi: "Diagnosi",
  preventivo: "Preventivo",
  attesa_approvazione: "Attesa Approv.",
  approvato: "Approvato",
  ordine_ricambi: "Ordine Ricambi",
  in_riparazione: "In Riparazione",
  riparato: "Riparato",
  pronto_consegna: "Pronto Consegna",
  consegnato: "Consegnato",
  cancelled: "Annullato",
};

const STATUS_COLORS: Record<string, string> = {
  accettazione: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  diagnosi: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  preventivo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_approvazione: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  approvato: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ordine_ricambi: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  in_riparazione: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  riparato: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  pronto_consegna: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  consegnato: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const B2B_STATUS_LABELS: Record<string, string> = {
  pending: "In Attesa",
  approved: "Approvato",
  processing: "In Elaborazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  received: "Ricevuto",
  cancelled: "Annullato",
};

const UTILITY_STATUS_LABELS: Record<string, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  attesa_documenti: "Attesa Documenti",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const UTILITY_STATUS_COLORS: Record<string, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const formatCurrency = (cents: number | null | undefined) => {
  if (cents === null || cents === undefined) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function AdminRepairCenterDetail() {
  const params = useParams<{ id: string }>();
  const centerId = params.id;

  const { data, isLoading, error } = useQuery<RepairCenterOverviewResponse>({
    queryKey: ["/api/admin/repair-centers", centerId, "overview"],
    enabled: !!centerId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-repair-center-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-repair-center-detail-error">
        <Link href="/admin/repair-centers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-centers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai centri
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Centro di riparazione non trovato
          </CardContent>
        </Card>
      </div>
    );
  }

  const { center, reseller, subReseller, repairs, b2bOrders, customers, staff, stats, usersMap, utilityPractices, suppliersMap, servicesMap } = data;

  return (
    <div className="space-y-6" data-testid="page-repair-center-detail">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/repair-centers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-centers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai centri
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-center-name">
            {center.name}
          </h1>
          <p className="text-muted-foreground">Dettagli centro di riparazione</p>
        </div>
        <Badge variant={center.isActive ? "default" : "secondary"} data-testid="badge-center-status">
          {center.isActive ? "Attivo" : "Inattivo"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-repairs">{stats.totalRepairs}</p>
                <p className="text-sm text-muted-foreground">Lavorazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-active-repairs">{stats.activeRepairs}</p>
                <p className="text-sm text-muted-foreground">Attive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-utility-practices">{stats.totalUtilityPractices}</p>
                <p className="text-sm text-muted-foreground">Pratiche Utility</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-customers">{stats.totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Clienti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-repairs-30days">{stats.repairs30Days}</p>
                <p className="text-sm text-muted-foreground">Ultimi 30gg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informazioni Centro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Indirizzo</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-center-address">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {center.address}, {center.city}
                  {center.cap && ` (${center.cap})`}
                  {center.provincia && ` ${center.provincia}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-center-email">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {center.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefono</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-center-phone">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {center.phone}
                </p>
              </div>
              {center.hourlyRateCents && (
                <div>
                  <p className="text-sm text-muted-foreground">Tariffa Oraria</p>
                  <p className="font-medium" data-testid="text-center-hourly-rate">
                    {(center.hourlyRateCents / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            {reseller && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Rivenditore di appartenenza</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/admin/resellers/${reseller.id}`}>
                    <span className="font-medium text-primary hover:underline cursor-pointer" data-testid="link-reseller">
                      {reseller.fullName}
                    </span>
                  </Link>
                </div>
              </div>
            )}
            {subReseller && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Sub-Reseller di riferimento</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/admin/resellers/${subReseller.id}`}>
                    <span className="font-medium text-primary hover:underline cursor-pointer" data-testid="link-sub-reseller">
                      {subReseller.fullName}
                    </span>
                  </Link>
                  {subReseller.email && (
                    <span className="text-sm text-muted-foreground">({subReseller.email})</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(center.ragioneSociale || center.partitaIva) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dati Fiscali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {center.ragioneSociale && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                    <p className="font-medium" data-testid="text-ragione-sociale">{center.ragioneSociale}</p>
                  </div>
                )}
                {center.partitaIva && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partita IVA</p>
                    <p className="font-medium" data-testid="text-partita-iva">{center.partitaIva}</p>
                  </div>
                )}
                {center.codiceFiscale && (
                  <div>
                    <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                    <p className="font-medium" data-testid="text-codice-fiscale">{center.codiceFiscale}</p>
                  </div>
                )}
                {center.codiceUnivoco && (
                  <div>
                    <p className="text-sm text-muted-foreground">Codice SDI</p>
                    <p className="font-medium" data-testid="text-codice-sdi">{center.codiceUnivoco}</p>
                  </div>
                )}
                {center.pec && (
                  <div>
                    <p className="text-sm text-muted-foreground">PEC</p>
                    <p className="font-medium" data-testid="text-pec">{center.pec}</p>
                  </div>
                )}
                {center.iban && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono text-sm" data-testid="text-iban">{center.iban}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="repairs" data-testid="tab-repairs">
            <Wrench className="h-4 w-4 mr-2" />
            Lavorazioni ({repairs.length})
          </TabsTrigger>
          <TabsTrigger value="utility" data-testid="tab-utility">
            <FileCheck className="h-4 w-4 mr-2" />
            Pratiche ({utilityPractices.length})
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <Package className="h-4 w-4 mr-2" />
            Ordini B2B ({b2bOrders.length})
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Clienti ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">
            <Users className="h-4 w-4 mr-2" />
            Staff ({staff.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repairs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Storico Lavorazioni</CardTitle>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna lavorazione trovata</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data Creazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairs.map((repair) => (
                      <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
                        <TableCell className="font-medium">
                          {usersMap[repair.customerId]?.fullName || "-"}
                        </TableCell>
                        <TableCell>
                          {repair.deviceType} - {repair.deviceBrand} {repair.deviceModel}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[repair.status] || ""}>
                            {STATUS_LABELS[repair.status] || repair.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(repair.createdAt), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/repairs/${repair.id}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-repair-${repair.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utility" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pratiche Utility</CardTitle>
            </CardHeader>
            <CardContent>
              {utilityPractices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna pratica utility trovata</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fornitore</TableHead>
                      <TableHead>Servizio</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilityPractices.map((practice) => (
                      <TableRow key={practice.id} data-testid={`row-practice-${practice.id}`}>
                        <TableCell className="font-medium">
                          {practice.customerId ? usersMap[practice.customerId]?.fullName : practice.temporaryCustomerName || "-"}
                        </TableCell>
                        <TableCell>
                          {practice.supplierId ? suppliersMap[practice.supplierId] : practice.temporarySupplierName || "-"}
                        </TableCell>
                        <TableCell>
                          {practice.serviceId ? servicesMap[practice.serviceId] : practice.customServiceName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={UTILITY_STATUS_COLORS[practice.status] || ""}>
                            {UTILITY_STATUS_LABELS[practice.status] || practice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {practice.priceType === "mensile" 
                            ? formatCurrency(practice.monthlyPriceCents) + "/mese"
                            : formatCurrency(practice.flatPriceCents)
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(practice.createdAt), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/utility/practices/${practice.id}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-practice-${practice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ordini B2B</CardTitle>
            </CardHeader>
            <CardContent>
              {b2bOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun ordine B2B trovato</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero Ordine</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Totale</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b2bOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {B2B_STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(order.totalAmountCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Clienti Associati</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun cliente associato</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                        <TableCell className="font-medium">{customer.fullName}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={customer.isActive ? "default" : "secondary"}>
                            {customer.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Assegnato</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuno staff assegnato</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id} data-testid={`row-staff-${member.id}`}>
                        <TableCell className="font-medium">{member.fullName}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
