import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Phone, Mail, MapPin, Wrench, Eye, CheckCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">I Miei Clienti</h1>
            <p className="text-muted-foreground">Clienti assegnati al tuo centro riparazione</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {customers.length} Clienti
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Clienti</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Riparazioni Completate</p>
                <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.completedRepairs, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Riparazioni in Corso</p>
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
                placeholder="Cerca per nome, email o telefono..."
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
              <p>Nessun cliente trovato</p>
              {customers.length === 0 && (
                <p className="text-sm mt-2">I clienti vengono assegnati dal rivenditore</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contatto</TableHead>
                    <TableHead className="text-center">Riparazioni</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
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
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {customer.pendingRepairs > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {customer.pendingRepairs} in corso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Nessuna attiva
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDetailDialogOpen(true);
                          }}
                          data-testid={`button-view-${customer.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dettagli Cliente
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
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
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-3">Contatti</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.indirizzo && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedCustomer.indirizzo}
                          {selectedCustomer.citta && `, ${selectedCustomer.citta}`}
                          {selectedCustomer.cap && ` (${selectedCustomer.cap})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Statistiche</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totale riparazioni:</span>
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
                  <h4 className="font-semibold mb-3">Storico Riparazioni</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {customerDetail.repairs.slice(0, 10).map((repair) => (
                        <div key={repair.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{repair.deviceType} - {repair.deviceBrand}</div>
                            <div className="text-sm text-muted-foreground">{repair.issueDescription?.slice(0, 50)}...</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={repair.status === 'delivered' ? 'default' : 'secondary'}>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
