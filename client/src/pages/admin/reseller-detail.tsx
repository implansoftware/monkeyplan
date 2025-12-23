import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { User, RepairCenter } from "@shared/schema";
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
  UsersRound,
  Eye,
  FileText,
  MapPin
} from "lucide-react";

type SafeUser = Omit<User, 'password'>;

interface ResellerOverviewResponse {
  reseller: SafeUser;
  subResellers: SafeUser[];
  repairCenters: RepairCenter[];
  customers: SafeUser[];
  staff: SafeUser[];
}

export default function AdminResellerDetail() {
  const params = useParams<{ id: string }>();
  const resellerId = params.id;

  const { data, isLoading, error } = useQuery<ResellerOverviewResponse>({
    queryKey: ["/api/admin/resellers", resellerId, "overview"],
    enabled: !!resellerId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-reseller-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-reseller-detail-error">
        <Link href="/admin/resellers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-resellers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai rivenditori
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Rivenditore non trovato
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reseller, subResellers, repairCenters, customers, staff } = data;
  const categoryLabel = reseller.resellerCategory === 'franchising' ? 'Franchising' : 
                        reseller.resellerCategory === 'gdo' ? 'GDO' : 'Standard';

  return (
    <div className="space-y-6" data-testid="page-reseller-detail">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/resellers">
          <Button variant="ghost" size="sm" data-testid="button-back-to-resellers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai rivenditori
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-reseller-name">
            {reseller.fullName}
          </h1>
          <p className="text-muted-foreground">Dettagli rivenditore</p>
        </div>
        <Badge variant="outline" data-testid="badge-reseller-category">
          {categoryLabel}
        </Badge>
        <Badge variant={reseller.isActive ? "default" : "secondary"} data-testid="badge-reseller-status">
          {reseller.isActive ? "Attivo" : "Inattivo"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informazioni Rivenditore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium" data-testid="text-reseller-username">{reseller.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2" data-testid="text-reseller-email">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {reseller.email}
                </p>
              </div>
              {reseller.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium flex items-center gap-2" data-testid="text-reseller-phone">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {reseller.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data Registrazione</p>
                <p className="font-medium" data-testid="text-reseller-created">
                  {reseller.createdAt ? format(new Date(reseller.createdAt), "dd MMM yyyy", { locale: it }) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dati Fiscali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                <p className="font-medium" data-testid="text-reseller-ragione-sociale">
                  {reseller.ragioneSociale || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partita IVA</p>
                <p className="font-medium" data-testid="text-reseller-piva">
                  {reseller.partitaIva || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                <p className="font-medium" data-testid="text-reseller-cf">
                  {reseller.codiceFiscale || "-"}
                </p>
              </div>
              {reseller.indirizzo && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Indirizzo</p>
                  <p className="font-medium flex items-center gap-2" data-testid="text-reseller-address">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {reseller.indirizzo}, {reseller.cap} {reseller.citta} ({reseller.provincia})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Store className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-sub-resellers">{subResellers.length}</p>
                <p className="text-sm text-muted-foreground">Sub-Rivenditori</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-repair-centers">{repairCenters.length}</p>
                <p className="text-sm text-muted-foreground">Centri Riparazione</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-customers">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Clienti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <UsersRound className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-staff">{staff.length}</p>
                <p className="text-sm text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="repair-centers" className="w-full">
        <TabsList>
          {(reseller.resellerCategory === 'franchising' || reseller.resellerCategory === 'gdo') && (
            <TabsTrigger value="sub-resellers" data-testid="tab-sub-resellers">
              Sub-Rivenditori ({subResellers.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="repair-centers" data-testid="tab-repair-centers">
            Centri Riparazione ({repairCenters.length})
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            Clienti ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">
            Staff ({staff.length})
          </TabsTrigger>
        </TabsList>

        {(reseller.resellerCategory === 'franchising' || reseller.resellerCategory === 'gdo') && (
          <TabsContent value="sub-resellers">
            <Card>
              <CardHeader>
                <CardTitle>Sub-Rivenditori</CardTitle>
              </CardHeader>
              <CardContent>
                {subResellers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessun sub-rivenditore</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefono</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subResellers.map((sub) => (
                        <TableRow key={sub.id} data-testid={`row-sub-reseller-${sub.id}`}>
                          <TableCell className="font-medium">{sub.fullName}</TableCell>
                          <TableCell>{sub.email}</TableCell>
                          <TableCell>{sub.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={sub.isActive ? "default" : "secondary"}>
                              {sub.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/resellers/${sub.id}`}>
                              <Button variant="ghost" size="icon" title="Visualizza dettagli">
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
        )}

        <TabsContent value="repair-centers">
          <Card>
            <CardHeader>
              <CardTitle>Centri Riparazione</CardTitle>
            </CardHeader>
            <CardContent>
              {repairCenters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun centro riparazione</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Città</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairCenters.map((rc) => (
                      <TableRow key={rc.id} data-testid={`row-repair-center-${rc.id}`}>
                        <TableCell className="font-medium">{rc.name}</TableCell>
                        <TableCell>{rc.city}</TableCell>
                        <TableCell>{rc.phone}</TableCell>
                        <TableCell>{rc.email}</TableCell>
                        <TableCell>
                          <Badge variant={rc.isActive ? "default" : "secondary"}>
                            {rc.isActive ? "Attivo" : "Inattivo"}
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

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Clienti</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun cliente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
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
                        <TableCell className="text-right">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" title="Visualizza dettagli">
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

        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Staff</CardTitle>
              <Link href={`/admin/resellers/${resellerId}/team`}>
                <Button variant="outline" size="sm" data-testid="button-manage-team">
                  <UsersRound className="h-4 w-4 mr-2" />
                  Gestisci Team
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun membro dello staff</p>
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
                    {staff.map((member) => (
                      <TableRow key={member.id} data-testid={`row-staff-${member.id}`}>
                        <TableCell className="font-medium">{member.fullName}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone || "-"}</TableCell>
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
