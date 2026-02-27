import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomerRelationshipsCard } from "@/components/CustomerRelationshipsCard";
import { Users, Search, Phone, Mail, MapPin, Wrench, Eye, CheckCircle, Clock, User, Plus, Pencil, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import type { User as UserType, RepairOrder } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CustomerWithStats = UserType & {
  totalRepairs: number;
  completedRepairs: number;
  pendingRepairs: number;
  repairs?: RepairOrder[];
};

export default function RepairCenterCustomers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery<CustomerWithStats[]>({
    queryKey: ["/api/repair-center/customers"],
  });

  const { data: customerDetail } = useQuery<CustomerWithStats>({
    queryKey: ["/api/repair-center/customers", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id && detailDialogOpen,
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/D";
    return format(new Date(date), "dd MMM yyyy", { locale: it });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Users className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("sidebar.sections.customers")}</h1>
              <p className="text-emerald-100">{t("customers.clientiAssegnatiAlTuoCentroRiparazione")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-lg px-3 py-1">
              {customers.length} Clienti
            </Badge>
            <Button
              onClick={() => setCsvImportOpen(true)}
              variant="outline"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-white/30"
              data-testid="button-import-csv"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("csvImport.importCsv")}
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
              data-testid="button-create-customer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("customers.totaleClienti")}</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.completedRepairs")}</p>
                <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.completedRepairs, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("customers.riparazioniInCorso")}</p>
                <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.pendingRepairs, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg">Elenco Clienti</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("customers.cercaPerNomeEmailOTelefono")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("customers.nessunClienteTrovato")}</p>
              {customers.length === 0 && (
                <p className="text-sm mt-2">{t("customers.creaIlPrimoClienteCliccandoSuNuovoCliente")}</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auth.customerTab")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("common.contact")}</TableHead>
                    <TableHead className="text-center">{t("sidebar.sections.repairs")}</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">{t("repairs.inProgress")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(customer.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.fullName}</div>
                            <div className="text-sm text-muted-foreground">@{customer.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline">
                            <Wrench className="h-3 w-3 mr-1" />
                            {customer.totalRepairs}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          {customer.pendingRepairs > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {customer.pendingRepairs} in corso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Nessuna riparazione
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDetailDialogOpen(true);
                            }}
                            data-testid={`button-quick-view-${customer.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            asChild
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Link href={`/repair-center/customers/${customer.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <User className="h-5 w-5" />
              Dettagli Cliente
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info" data-testid="tab-customer-info">{t("common.information")}</TabsTrigger>
                <TabsTrigger value="relationships" data-testid="tab-customer-relationships">Parentele</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6 mt-4">
              <div className="flex gap-4 items-start">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedCustomer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedCustomer.fullName}</h3>
                  <p className="text-muted-foreground">@{selectedCustomer.username}</p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="outline">
                      <Wrench className="h-3 w-3 mr-1" />
                      {selectedCustomer.totalRepairs} riparazioni
                    </Badge>
                    {selectedCustomer.pendingRepairs > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {selectedCustomer.pendingRepairs} in corso
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-3">{t("common.contacts")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.indirizzo && (
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedCustomer.indirizzo}
                          {selectedCustomer.citta && `, ${selectedCustomer.citta}`}
                          {selectedCustomer.cap && ` (${selectedCustomer.cap})`}
                        </span>
                      </div>
                    )}
                    {(selectedCustomer as any).notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">{t("common.notes")}</p>
                        <p className="text-sm whitespace-pre-wrap" data-testid="text-customer-notes">{(selectedCustomer as any).notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">{t("dashboard.statistics")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("customers.totaleRiparazioni")}</span>
                      <span className="font-medium">{selectedCustomer.totalRepairs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completate:</span>
                      <span className="font-medium text-green-600">{selectedCustomer.completedRepairs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In corso:</span>
                      <span className="font-medium text-yellow-600">{selectedCustomer.pendingRepairs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente dal:</span>
                      <span className="font-medium">{formatDate(selectedCustomer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {customerDetail?.repairs && customerDetail.repairs.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">{t("customers.repairHistory")}</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {customerDetail.repairs.slice(0, 10).map((repair) => (
                        <div key={repair.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{repair.deviceType} - {repair.deviceModel}</div>
                            <div className="text-sm text-muted-foreground">{repair.issueDescription?.slice(0, 50)}...</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={repair.status === 'consegnato' ? 'default' : 'secondary'}>
                              {repair.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(repair.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              </TabsContent>
              
              <TabsContent value="relationships" className="mt-4">
                <CustomerRelationshipsCard customerId={selectedCustomer.id} />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Customer Wizard Dialog */}
      <CustomerWizardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/repair-center/customers"] });
          setCreateDialogOpen(false);
        }}
      />
      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        apiEndpoint="/api/repair-center/customers/import-csv"
        queryKeyToInvalidate="/api/repair-center/customers"
      />
    </div>
  );
}
