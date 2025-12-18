import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, BillingData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Pencil, Trash2, Download, Users, CalendarIcon, UserPlus, Building2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { Link } from "wouter";

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ fullName: "", email: "", resellerId: "", isActive: true });
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/customers"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const csv = [
        ['Nome', 'Email', 'Username', 'Rivenditore', 'Stato', 'Data Creazione'].join(','),
        ...filteredCustomers.map(c => {
          const reseller = resellers.find(r => r.id === c.resellerId);
          return [
            c.fullName,
            c.email,
            c.username,
            reseller?.fullName || 'N/D',
            c.isActive ? 'Attivo' : 'Inattivo',
            format(new Date(c.createdAt), "dd/MM/yyyy")
          ].join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clienti_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export completato",
        description: "Il file CSV è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente eliminato" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      toast({ title: "Cliente aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleEditCustomer = (customer: User) => {
    setEditingCustomer(customer);
    setEditFormData({
      fullName: customer.fullName,
      email: customer.email,
      resellerId: customer.resellerId || "",
      isActive: customer.isActive,
    });
  };

  const handleSaveEdit = () => {
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      data: {
        fullName: editFormData.fullName,
        email: editFormData.email,
        resellerId: editFormData.resellerId || null,
        isActive: editFormData.isActive,
      },
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReseller = resellerFilter === "all" || customer.resellerId === resellerFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const createdAt = new Date(customer.createdAt);
      matchesDate = createdAt >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && createdAt <= dateRange.to;
      }
    }
    
    return matchesSearch && matchesReseller && matchesDate;
  });

  const activeCustomers = filteredCustomers.filter(c => c.isActive).length;
  const totalCustomers = filteredCustomers.length;

  return (
    <div className="space-y-6" data-testid="page-admin-customers">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Gestione Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci tutti i clienti dei rivenditori
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            disabled={isExporting || customers.length === 0}
            variant="outline"
            data-testid="button-export-customers"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Esportazione..." : "Esporta CSV"}
          </Button>
          <Button variant="default" onClick={() => setWizardOpen(true)} data-testid="button-new-customer">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuovo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Clienti</p>
                <p className="text-2xl font-bold" data-testid="text-total-customers">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clienti Attivi</p>
                <p className="text-2xl font-bold" data-testid="text-active-customers">{activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rivenditori</p>
                <p className="text-2xl font-bold" data-testid="text-resellers-count">{resellers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, email o username..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-customers"
              />
            </div>
            <Select value={resellerFilter} onValueChange={setResellerFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-reseller-filter">
                <SelectValue placeholder="Tutti i rivenditori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i rivenditori</SelectItem>
                {resellers.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[200px] justify-start" data-testid="button-date-filter">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy", { locale: it })} -{" "}
                        {format(dateRange.to, "dd/MM/yy", { locale: it })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: it })
                    )
                  ) : (
                    "Seleziona periodo"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={it}
                />
              </PopoverContent>
            </Popover>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Rivenditore</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nessun cliente trovato
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const reseller = resellers.find(r => r.id === customer.resellerId);
                      return (
                        <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                          <TableCell className="font-medium">{customer.fullName}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.username}</TableCell>
                          <TableCell>
                            {reseller ? (
                              <Badge variant="secondary">{reseller.fullName}</Badge>
                            ) : (
                              <span className="text-muted-foreground">N/D</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.isActive ? "default" : "secondary"}>
                              {customer.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/admin/customers/${customer.id}`}>
                                <Button size="icon" variant="ghost" data-testid={`button-view-customer-${customer.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditCustomer(customer)}
                                data-testid={`button-edit-customer-${customer.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCustomerMutation.mutate(customer.id)}
                                data-testid={`button-delete-customer-${customer.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerWizardDialog 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        }}
      />

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Nome Completo</Label>
              <Input
                id="edit-fullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                data-testid="input-edit-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reseller">Rivenditore</Label>
              <Select
                value={editFormData.resellerId || "none"}
                onValueChange={(value) => setEditFormData({ ...editFormData, resellerId: value === "none" ? "" : value })}
              >
                <SelectTrigger id="edit-reseller" data-testid="select-edit-reseller">
                  <SelectValue placeholder="Seleziona rivenditore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun rivenditore</SelectItem>
                  {resellers.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Stato Attivo</Label>
              <Switch
                id="edit-active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
                data-testid="switch-edit-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)} data-testid="button-cancel-edit">
              Annulla
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={updateCustomerMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateCustomerMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
