import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "qrcode";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Search, Mail, Building2, Wrench, Pencil, X, Check, Trash2, Phone, UserCheck, Eye, ChevronRight, TrendingUp, Filter, Upload, Link2, Copy, Trash, ToggleLeft, ToggleRight, ExternalLink, QrCode, Download, Key } from "lucide-react";
import { Link } from "wouter";
import { CustomerRelationshipsCard } from "@/components/CustomerRelationshipsCard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { User, RepairOrder, RepairCenter } from "@shared/schema";
import { CustomerBranchManager } from "@/components/CustomerBranchManager";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import { useToast } from "@/hooks/use-toast";
import { ActionGuard } from "@/components/permission-guard";
import { useTranslation } from "react-i18next";

type CustomerWithRepairCenters = User & {
  assignedRepairCenters?: RepairCenter[];
};

type FilterType = "all" | "active" | "inactive";

export default function ResellerCustomers() {
  const { t } = useTranslation();
  const [inviteLinksOpen, setInviteLinksOpen] = useState(false);
  const [newLinkType, setNewLinkType] = useState<"private" | "business">("private");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkMaxUsages, setNewLinkMaxUsages] = useState("");
  const [newLinkExpiry, setNewLinkExpiry] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLinkLabel, setQrLinkLabel] = useState<string>("");

  // Invite links
  const { data: inviteLinks = [], refetch: refetchLinks } = useQuery<any[]>({
    queryKey: ["/api/reseller/invite-links"],
    enabled: inviteLinksOpen,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reseller/invite-links", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/invite-links"] });
      setNewLinkLabel("");
      setNewLinkMaxUsages("");
      setNewLinkExpiry("");
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const toggleLinkMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/reseller/invite-links/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/reseller/invite-links"] }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reseller/invite-links/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/reseller/invite-links"] }),
  });

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copiato!", description: "Link copiato negli appunti" });
  };

  const openQrDialog = async (token: string, label: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2 });
    setQrDataUrl(dataUrl);
    setQrLinkLabel(label || "Link invito");
    setQrDialogOpen(true);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${qrLinkLabel.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRepairCenters | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerWithRepairCenters | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
    repairCenterIds: [] as string[],
    notes: "",
  });
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<CustomerWithRepairCenters[]>({
    queryKey: ["/api/reseller/customers"],
  });

  const { data: allRepairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-orders"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: subResellers = [] } = useQuery<User[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const hasSubResellers = subResellers.length > 0;

  const getSubResellerName = (subResellerId: string | null | undefined) => {
    if (!subResellerId) return null;
    const subReseller = subResellers.find(sr => sr.id === subResellerId);
    return subReseller?.fullName || null;
  };

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string; updates: typeof editForm }) => {
      return await apiRequest("PATCH", `/api/reseller/customers/${data.id}`, data.updates);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      toast({ title: t("customers.customerUpdatedSuccess") });
      setIsEditing(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest("DELETE", `/api/reseller/customers/${customerId}`);
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      toast({ title: t("customers.customerDeleted") });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: async (error: any) => {
      const errorMsg = error.message || "";
      const jsonMatch = errorMsg.match(/^\d+:\s*(.+)$/);
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[1]);
          if (errorData.error === "ACTIVE_REPAIRS") {
            toast({ 
              title: t("customers.cannotDeleteCustomer"), 
              description: errorData.message,
              variant: "destructive" 
            });
            return;
          }
        } catch {
        }
      }
      toast({ title: t("common.error"), description: errorMsg, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return apiRequest("POST", `/api/reseller/customers/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setResetPasswordValue("");
      toast({ title: t("team.passwordUpdated"), description: t("team.passwordUpdatedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message || t("team.cannotResetPassword"), variant: "destructive" });
    },
  });

  const handleDeleteClick = (customer: CustomerWithRepairCenters) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete.id);
    }
  };

  const customers = allUsers.filter(user => user.role === "customer");

  const handleCustomerCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
    setDialogOpen(false);
  };

  const startEditing = (customer: CustomerWithRepairCenters) => {
    setEditForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || "",
      isActive: customer.isActive,
      repairCenterIds: customer.assignedRepairCenters?.map(rc => rc.id) || [],
      notes: (customer as any).notes || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        updates: editForm,
      });
    }
  };

  const toggleRepairCenter = (centerId: string) => {
    setEditForm(prev => ({
      ...prev,
      repairCenterIds: prev.repairCenterIds.includes(centerId)
        ? prev.repairCenterIds.filter(id => id !== centerId)
        : [...prev.repairCenterIds, centerId],
    }));
  };

  const getCustomerRepairs = (customerId: string) => {
    return allRepairs.filter(repair => repair.customerId === customerId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">{t("hr.pending")}</Badge>;
      case "in_progress": return <Badge>{t("tickets.status.inProgress")}</Badge>;
      case "completed": return <Badge variant="outline">Completata</Badge>;
      case "delivered": return <Badge variant="outline">{t("shipping.delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("common.cancelled")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeCustomers = customers.filter(c => c.isActive).length;
  const inactiveCustomers = customers.filter(c => !c.isActive).length;
  const totalRepairs = allRepairs.length;

  const filteredCustomers = customers
    .filter((customer) => {
      if (activeFilter === "active") return customer.isActive;
      if (activeFilter === "inactive") return !customer.isActive;
      return true;
    })
    .filter((customer) =>
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6" data-testid="page-reseller-customers">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{t("customers.title")}</h1>
                <p className="text-sm text-white/80">
                  Gestisci la tua base clienti
                </p>
              </div>
            </div>
          </div>
          <ActionGuard module="customers" action="create">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setInviteLinksOpen(true)} variant="outline" className="bg-white/10 backdrop-blur-sm border border-white/30 text-white" data-testid="button-invite-links">
                <Link2 className="h-4 w-4 mr-2" />Link Invito
              </Button>
              <Button onClick={() => setCsvImportOpen(true)} variant="outline" className="bg-white/10 backdrop-blur-sm border border-white/30 text-white" data-testid="button-import-csv">
                <Upload className="h-4 w-4 mr-2" />{t("csvImport.importCsv")}
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-new-customer">
                <Plus className="h-4 w-4 mr-2" />{t("customers.newCustomer")}
              </Button>
            </div>
            <CustomerWizardDialog 
              open={dialogOpen} 
              onOpenChange={setDialogOpen}
              onSuccess={handleCustomerCreated}
            />
            <CsvImportDialog
              open={csvImportOpen}
              onOpenChange={setCsvImportOpen}
              apiEndpoint="/api/reseller/customers/import-csv"
              queryKeyToInvalidate="/api/reseller/customers"
            />
          </ActionGuard>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Clienti</p>
                <p className="text-3xl font-bold tabular-nums">{customers.length}</p>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+12% questo mese</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Clienti Attivi</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{activeCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.length > 0 ? Math.round((activeCustomers / customers.length) * 100) : 0}% del totale
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("dashboard.totalRepairs")}</p>
                <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{totalRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Media {customers.length > 0 ? (totalRepairs / customers.length).toFixed(1) : 0} per cliente
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-base font-semibold">Elenco Clienti</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {filteredCustomers.length} risultati
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("all")}
                >{t("common.allMasc")}<Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{customers.length}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "active" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("active")}
                >
                  Attivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{activeCustomers}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "inactive" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("inactive")}
                >
                  Inattivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{inactiveCustomers}</Badge>
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("customers.searchCustomerPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">{t("customers.noCustomerFound")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? t("common.tryDifferentSearch") : t("customers.startAddingFirstCustomer")}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="pl-6 w-[250px]">{t("common.customer")}</TableHead>
                    <TableHead>{t("common.contacts")}</TableHead>
                    {hasSubResellers && <TableHead>{t("roles.subReseller")}</TableHead>}
                    <TableHead className="text-center">{t("common.status")}</TableHead>
                    <TableHead className="text-center">{t("roles.repairCenter")}</TableHead>
                    <TableHead className="text-center">{t("repairs.title")}</TableHead>
                    <TableHead className="pr-6 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => {
                    const customerRepairs = getCustomerRepairs(customer.id);
                    const subResellerName = getSubResellerName(customer.subResellerId);
                    return (
                      <TableRow 
                        key={customer.id} 
                        data-testid={`row-customer-${customer.id}`}
                        className={`group ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <TableCell className="pl-6 relative">
                          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${customer.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div>
                            <p className="font-medium" data-testid={`text-name-${customer.id}`}>
                              {customer.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              @{customer.username}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {hasSubResellers && (
                          <TableCell>
                            {subResellerName ? (
                              <Badge variant="outline" className="font-normal" data-testid={`badge-sub-reseller-${customer.id}`}>
                                {subResellerName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          {customer.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-normal">{t("common.active")}</Badge>
                          ) : (
                            <Badge variant="secondary" className="font-normal">{t("common.inactive")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.assignedRepairCenters && customer.assignedRepairCenters.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {customer.assignedRepairCenters.map(rc => (
                                <Badge key={rc.id} variant="outline" className="font-normal text-xs" data-testid={`badge-rc-${customer.id}-${rc.id}`}>
                                  <Wrench className="h-3 w-3 mr-1" />
                                  {rc.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="font-normal text-xs" data-testid={`badge-rc-none-${customer.id}`}>{t("tickets.unassigned")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-normal tabular-nums" data-testid={`badge-repairs-${customer.id}`}>
                            {customerRepairs.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Link href={`/reseller/customers/${customer.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                data-testid={`button-view-${customer.id}`}
                              >{t("common.details")}<ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                            <ActionGuard module="customers" action="delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(customer)}
                                title={t("customers.deleteCustomer")}
                                data-testid={`button-delete-${customer.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ActionGuard>
                          </div>
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

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => { setSelectedCustomer(null); setIsEditing(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle>{selectedCustomer.fullName}</DialogTitle>
                {!isEditing && (
                  <div className="flex items-center gap-2">
                    <ActionGuard module="customers" action="update">
                      <Button variant="outline" size="icon" onClick={() => { setResetPasswordDialogOpen(true); setResetPasswordValue(""); }} title={t("team.resetPassword")} data-testid="button-reset-customer-password">
                        <Key className="h-4 w-4" />
                      </Button>
                    </ActionGuard>
                    <ActionGuard module="customers" action="update">
                      <Button variant="outline" size="sm" onClick={() => startEditing(selectedCustomer)} data-testid="button-edit-customer">
                        <Pencil className="h-4 w-4 mr-1" />{t("common.edit")}</Button>
                    </ActionGuard>
                  </div>
                )}
              </div>
            </DialogHeader>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">{t("profile.fullName")}</Label>
                    <Input
                      id="edit-fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      data-testid="input-edit-fullName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{t("common.email")}</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-edit-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">{t("common.phone")}</Label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-edit-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common.status")}</Label>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Switch
                        checked={editForm.isActive}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-edit-isActive"
                      />
                      <span className="text-sm">{editForm.isActive ? t("common.active") : t("common.inactive")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="flex flex-wrap items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4" />
                    Centri Riparazione Assegnati
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {repairCenters.map((rc) => {
                      const isSelected = editForm.repairCenterIds.includes(rc.id);
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
                    {repairCenters.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nessun centro di riparazione disponibile</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <Label htmlFor="edit-notes">{t("common.notes")}</Label>
                  <Textarea
                    id="edit-notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t("customer.notesPlaceholder")}
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-edit-notes"
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">{t("common.cancel")}</Button>
                  <Button onClick={saveEditing} disabled={updateCustomerMutation.isPending} data-testid="button-save-edit">
                    {updateCustomerMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info" data-testid="tab-customer-info">{t("common.information")}</TabsTrigger>
                  <TabsTrigger value="branches" data-testid="tab-customer-branches">Filiali</TabsTrigger>
                  <TabsTrigger value="repairs" data-testid="tab-customer-repairs">{t("repairs.title")}</TabsTrigger>
                  <TabsTrigger value="relationships" data-testid="tab-customer-relationships">Parentele</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("common.email")}</Label>
                      <p className="text-sm">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("admin.common.usernameLabel")}</Label>
                      <p className="text-sm font-mono">@{selectedCustomer.username}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("common.phone")}</Label>
                      <p className="text-sm">
                        {selectedCustomer.phone || <span className="text-muted-foreground">-</span>}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("common.status")}</Label>
                      <p className="text-sm">
                        {selectedCustomer.isActive ? t("common.active") : t("common.inactive")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Registrazione</Label>
                      <p className="text-sm">
                        {format(new Date(selectedCustomer.createdAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                    {hasSubResellers && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("roles.subReseller")}</Label>
                        <p className="text-sm">
                          {getSubResellerName(selectedCustomer.subResellerId) || <span className="text-muted-foreground">-</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCustomer.assignedRepairCenters && selectedCustomer.assignedRepairCenters.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">{t("sidebar.items.repairCentersShort")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.assignedRepairCenters.map((rc) => (
                          <Badge key={rc.id} variant="secondary" data-testid={`badge-detail-repair-center-${rc.id}`}>
                            {rc.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedCustomer as any).notes && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-1 block">{t("common.notes")}</Label>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground" data-testid="text-customer-notes">{(selectedCustomer as any).notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="branches" className="mt-4">
                  <CustomerBranchManager 
                    customerId={selectedCustomer.id} 
                    customerName={selectedCustomer.fullName}
                  />
                </TabsContent>

                <TabsContent value="repairs" className="mt-4">
                  {getCustomerRepairs(selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nessuna riparazione</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.order")}</TableHead>
                          <TableHead>{t("repairs.device")}</TableHead>
                          <TableHead>{t("common.status")}</TableHead>
                          <TableHead>{t("common.date")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCustomerRepairs(selectedCustomer.id).map((repair) => (
                          <TableRow key={repair.id}>
                            <TableCell className="font-mono text-sm">{repair.orderNumber}</TableCell>
                            <TableCell>{repair.deviceType}</TableCell>
                            <TableCell>{getStatusBadge(repair.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(repair.createdAt), "dd/MM/yy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="relationships" className="mt-4">
                  {selectedCustomer && (
                    <CustomerRelationshipsCard customerId={selectedCustomer.id} />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare <strong>{customerToDelete?.fullName}</strong>. 
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? t("pages.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              QR Code — {qrLinkLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="rounded-md border" width={280} height={280} />
            )}
            <p className="text-xs text-muted-foreground text-center">
              Scansiona con la fotocamera per aprire il link di registrazione
            </p>
            <Button className="w-full" onClick={downloadQr} data-testid="button-download-qr">
              <Download className="h-4 w-4 mr-2" />
              Scarica PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Links Sheet */}
      <Sheet open={inviteLinksOpen} onOpenChange={setInviteLinksOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Link di Invito Clienti
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pt-4">
            {/* Create new link */}
            <div className="space-y-3 p-4 border rounded-md bg-muted/30">
              <p className="text-sm font-medium">Crea nuovo link</p>
              <div className="space-y-2">
                <Label className="text-xs">Tipo cliente</Label>
                <Select value={newLinkType} onValueChange={(v: any) => setNewLinkType(v)}>
                  <SelectTrigger data-testid="select-link-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privato</SelectItem>
                    <SelectItem value="business">Azienda / P.IVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Etichetta (opzionale)</Label>
                <Input
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder="Es: Clienti estate 2025"
                  data-testid="input-link-label"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Max utilizzi</Label>
                  <Input
                    type="number"
                    value={newLinkMaxUsages}
                    onChange={e => setNewLinkMaxUsages(e.target.value)}
                    placeholder="Illimitato"
                    min="1"
                    data-testid="input-link-max-usages"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Scadenza</Label>
                  <Input
                    type="date"
                    value={newLinkExpiry}
                    onChange={e => setNewLinkExpiry(e.target.value)}
                    data-testid="input-link-expiry"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createLinkMutation.mutate({
                  customerType: newLinkType,
                  label: newLinkLabel || undefined,
                  maxUsages: newLinkMaxUsages ? parseInt(newLinkMaxUsages) : undefined,
                  expiresAt: newLinkExpiry || undefined,
                })}
                disabled={createLinkMutation.isPending}
                data-testid="button-create-link"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createLinkMutation.isPending ? "Creazione..." : "Crea link"}
              </Button>
            </div>

            {/* List of links */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Link attivi</p>
              {inviteLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nessun link creato ancora
                </div>
              ) : (
                <div className="space-y-2">
                  {inviteLinks.map((link: any) => {
                    const url = `${window.location.origin}/invite/${link.token}`;
                    const expired = link.expiresAt && new Date() > new Date(link.expiresAt);
                    const exhausted = link.maxUsages && link.usageCount >= link.maxUsages;
                    return (
                      <div key={link.id} className="border rounded-md p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium truncate">{link.label || "Link senza etichetta"}</span>
                              <Badge variant={link.isActive && !expired && !exhausted ? "default" : "secondary"} className="text-xs">
                                {!link.isActive ? "Disattivo" : expired ? "Scaduto" : exhausted ? "Esaurito" : link.customerType === "business" ? "Azienda" : "Privato"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{url}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">Utilizzi: {link.usageCount}{link.maxUsages ? `/${link.maxUsages}` : ""}</span>
                              {link.expiresAt && <span className="text-xs text-muted-foreground">Scade: {new Date(link.expiresAt).toLocaleDateString("it-IT")}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => copyInviteLink(link.token)} data-testid={`button-copy-link-${link.id}`}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copia link</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => openQrDialog(link.token, link.label || "")} data-testid={`button-qr-link-${link.id}`}>
                                    <QrCode className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>QR Code</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => window.open(url, "_blank")} data-testid={`button-open-link-${link.id}`}>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Apri link</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => toggleLinkMutation.mutate({ id: link.id, isActive: !link.isActive })}
                                    data-testid={`button-toggle-link-${link.id}`}
                                  >
                                    {link.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{link.isActive ? "Disattiva" : "Attiva"}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteLinkMutation.mutate(link.id)}
                                    data-testid={`button-delete-link-${link.id}`}
                                  >
                                    <Trash className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Elimina</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    {/* Reset Password Dialog */}
    {selectedCustomer && (
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => { setResetPasswordDialogOpen(open); if (!open) setResetPasswordValue(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("team.resetPassword")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t("team.resetPasswordDesc") || `Imposta una nuova password per ${selectedCustomer.fullName}`}
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-customer-password">{t("team.newPassword")}</Label>
              <Input
                id="new-customer-password"
                type="password"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder={t("customers.minChars", { count: 4 })}
                data-testid="input-new-customer-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => resetPasswordMutation.mutate({ id: selectedCustomer.id, newPassword: resetPasswordValue })}
              disabled={resetPasswordMutation.isPending || resetPasswordValue.length < 4}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? t("common.processing") : t("team.resetPassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </div>
  );
}
