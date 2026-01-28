import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pencil, Trash2, Download, Users, CalendarIcon, UserPlus, Building2, Eye, Loader2, Activity } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { Link } from "wouter";

interface CustomerEditFormData {
  fullName: string;
  email: string;
  phone: string;
  resellerId: string;
  isActive: boolean;
  customerType: "private" | "company";
  companyName: string;
  vatNumber: string;
  fiscalCode: string;
  pec: string;
  codiceUnivoco: string;
  iban: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

const defaultFormData: CustomerEditFormData = {
  fullName: "",
  email: "",
  phone: "",
  resellerId: "",
  isActive: true,
  customerType: "private",
  companyName: "",
  vatNumber: "",
  fiscalCode: "",
  pec: "",
  codiceUnivoco: "",
  iban: "",
  address: "",
  city: "",
  zipCode: "",
  country: "IT",
};

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<CustomerEditFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState("personal");
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
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente eliminato" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Errore", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}/billing`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const { data: customerDetails, isLoading: isLoadingDetails } = useQuery<{ 
    customer: User; 
    billingData: BillingData | null;
  }>({
    queryKey: [`/api/customers/${editingCustomer?.id}`],
    enabled: !!editingCustomer,
  });

  useEffect(() => {
    if (customerDetails && editingCustomer) {
      const { customer, billingData } = customerDetails;
      setEditFormData({
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone || "",
        resellerId: customer.resellerId || "",
        isActive: customer.isActive,
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
      });
    }
  }, [customerDetails, editingCustomer]);

  const handleEditCustomer = (customer: User) => {
    setEditingCustomer(customer);
    setActiveTab("personal");
    setEditFormData(defaultFormData);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || isLoadingDetails || !customerDetails) return;
    
    try {
      await updateCustomerMutation.mutateAsync({
        id: editingCustomer.id,
        data: {
          fullName: editFormData.fullName,
          email: editFormData.email,
          resellerId: editFormData.resellerId || null,
          isActive: editFormData.isActive,
        },
      });
      
      await updateBillingMutation.mutateAsync({
        id: editingCustomer.id,
        data: {
          customerType: editFormData.customerType,
          companyName: editFormData.companyName || null,
          vatNumber: editFormData.vatNumber || null,
          fiscalCode: editFormData.fiscalCode || null,
          pec: editFormData.pec || null,
          codiceUnivoco: editFormData.codiceUnivoco || null,
          iban: editFormData.iban || null,
          address: editFormData.address,
          city: editFormData.city,
          zipCode: editFormData.zipCode,
          country: editFormData.country,
        },
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${editingCustomer.id}`] });
      setEditingCustomer(null);
      toast({ title: "Cliente aggiornato con successo" });
    } catch (error) {
    }
  };

  const isSaving = updateCustomerMutation.isPending || updateBillingMutation.isPending;

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
      {/* Hero Header - Modern Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Gestione Clienti</h1>
              <p className="text-cyan-100/80 mt-1">Gestisci tutti i clienti dei rivenditori</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleExport}
              disabled={isExporting || customers.length === 0}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              data-testid="button-export-customers"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Esportazione..." : "Esporta CSV"}
            </Button>
            <Button 
              onClick={() => setWizardOpen(true)} 
              className="bg-white text-blue-700 hover:bg-white/90 shadow-lg"
              data-testid="button-new-customer"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-blue-100">Totale Clienti</p>
              <p className="text-3xl font-bold" data-testid="text-total-customers">{totalCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-100">Clienti Attivi</p>
              <p className="text-3xl font-bold" data-testid="text-active-customers">{activeCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-violet-500/25">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-violet-100">Rivenditori</p>
              <p className="text-3xl font-bold" data-testid="text-resellers-count">{resellers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Cerca per nome, email o username..."
                className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-customers"
              />
            </div>
            <Select value={resellerFilter} onValueChange={setResellerFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl" data-testid="select-reseller-filter">
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
                <Button variant="outline" className="w-full sm:w-[200px] h-12 rounded-xl justify-start" data-testid="button-date-filter">
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Username</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Rivenditore</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Data Creazione</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Nessun cliente trovato</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const reseller = resellers.find(r => r.id === customer.resellerId);
                      return (
                        <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <TableCell className="font-medium text-slate-900 dark:text-white">{customer.fullName}</TableCell>
                          <TableCell className="text-slate-500">{customer.email}</TableCell>
                          <TableCell className="text-slate-500 font-mono text-sm">{customer.username}</TableCell>
                          <TableCell>
                            {reseller ? (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{reseller.fullName}</Badge>
                            ) : (
                              <span className="text-slate-400">N/D</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={customer.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600"}>
                              {customer.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/admin/customers/${customer.id}`}>
                                <Button size="icon" variant="ghost" className="hover:bg-blue-100 hover:text-blue-600" data-testid={`button-view-customer-${customer.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-amber-100 hover:text-amber-600"
                                onClick={() => handleEditCustomer(customer)}
                                data-testid={`button-edit-customer-${customer.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-red-100 hover:text-red-600"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              Modifica Cliente
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <TabsTrigger value="personal" className="rounded-lg" data-testid="tab-personal">Dati Personali</TabsTrigger>
                <TabsTrigger value="assignment" className="rounded-lg" data-testid="tab-assignment">Assegnazione</TabsTrigger>
                <TabsTrigger value="billing" className="rounded-lg" data-testid="tab-billing">Fatturazione</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName" className="text-slate-700 dark:text-slate-300">Nome Completo</Label>
                    <Input
                      id="edit-fullName"
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      className="h-11 rounded-xl"
                      data-testid="input-edit-fullname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-slate-700 dark:text-slate-300">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="h-11 rounded-xl"
                      data-testid="input-edit-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-slate-700 dark:text-slate-300">Telefono</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="h-11 rounded-xl"
                    data-testid="input-edit-phone"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="assignment" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-reseller" className="text-slate-700 dark:text-slate-300">Rivenditore</Label>
                  <Select
                    value={editFormData.resellerId || "none"}
                    onValueChange={(value) => setEditFormData({ ...editFormData, resellerId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="edit-reseller" className="h-11 rounded-xl" data-testid="select-edit-reseller">
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
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-300">Account Attivo</Label>
                    <p className="text-sm text-slate-500">Consenti l'accesso al cliente</p>
                  </div>
                  <Switch
                    checked={editFormData.isActive}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
                    data-testid="switch-edit-active"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Tipo Cliente</Label>
                  <Select
                    value={editFormData.customerType}
                    onValueChange={(value: "private" | "company") => setEditFormData({ ...editFormData, customerType: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl" data-testid="select-edit-customer-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privato</SelectItem>
                      <SelectItem value="company">Azienda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {editFormData.customerType === "company" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Ragione Sociale</Label>
                        <Input
                          value={editFormData.companyName}
                          onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                          className="h-11 rounded-xl"
                          data-testid="input-edit-company-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Partita IVA</Label>
                        <Input
                          value={editFormData.vatNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, vatNumber: e.target.value })}
                          className="h-11 rounded-xl"
                          data-testid="input-edit-vat"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">PEC</Label>
                        <Input
                          value={editFormData.pec}
                          onChange={(e) => setEditFormData({ ...editFormData, pec: e.target.value })}
                          className="h-11 rounded-xl"
                          data-testid="input-edit-pec"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Codice SDI</Label>
                        <Input
                          value={editFormData.codiceUnivoco}
                          onChange={(e) => setEditFormData({ ...editFormData, codiceUnivoco: e.target.value })}
                          className="h-11 rounded-xl"
                          data-testid="input-edit-sdi"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Codice Fiscale</Label>
                  <Input
                    value={editFormData.fiscalCode}
                    onChange={(e) => setEditFormData({ ...editFormData, fiscalCode: e.target.value })}
                    className="h-11 rounded-xl"
                    data-testid="input-edit-cf"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Indirizzo</Label>
                  <Input
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="h-11 rounded-xl"
                    data-testid="input-edit-address"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">CAP</Label>
                    <Input
                      value={editFormData.zipCode}
                      onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                      className="h-11 rounded-xl"
                      data-testid="input-edit-zip"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300">Citta</Label>
                    <Input
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="h-11 rounded-xl"
                      data-testid="input-edit-city"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingCustomer(null)} className="rounded-xl">
              Annulla
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              data-testid="button-save-edit"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Modifiche"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
