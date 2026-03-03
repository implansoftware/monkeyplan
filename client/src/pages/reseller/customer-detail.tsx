import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { User, RepairOrder, SalesOrder, BillingData, UtilityPractice, RepairCenter } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerRelationshipsCard } from "@/components/CustomerRelationshipsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Wrench, 
  ShoppingCart, 
  FileText,
  Zap,
  UserCheck,
  Pencil,
  Check,
  ChevronRight,
  Key,
  MapPin,
  CreditCard,
  User as UserIcon,
  Calendar,
  Shield
} from "lucide-react";
import { getStatusConfig } from "@/lib/repair-status-config";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ResellerCustomerDetail() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const dateLocale = i18n.language === "it" ? it : enUS;

  const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ["/api/reseller/customers", customerId],
    enabled: !!customerId,
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: Record<string, unknown>) => {
      const response = await apiRequest("PATCH", `/api/reseller/customers/${customerId}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      setEditDialogOpen(false);
      toast({
        title: t("customers.customerUpdated"),
        description: t("customers.customerDataSaved"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("customers.cannotUpdate"),
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-customer-detail-loading">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6" data-testid="page-customer-detail-error">
        <Link href="/reseller/customers">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-to-customers">
            <ArrowLeft className="h-4 w-4" />
            {t("customers.backToCustomers")}
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground text-lg">{t("customers.customerNotFound")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, subReseller, repairOrders, salesOrders, billingData, utilityPractices = [] } = data;

  const stats = [
    { label: t("repairs.title"), value: repairOrders.length, icon: Wrench, color: "from-blue-500 to-blue-600" },
    { label: t("common.orders"), value: salesOrders.length, icon: ShoppingCart, color: "from-emerald-500 to-green-600" },
    { label: t("admin.repairCenters.utilityPractices"), value: utilityPractices.length, icon: Zap, color: "from-amber-500 to-orange-600" },
    { label: t("customers.billingData"), value: billingData ? 1 : 0, icon: FileText, color: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-6 sm:p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10">
          <Link href="/reseller/customers">
            <Button variant="ghost" size="sm" className="text-white/80 mb-4" data-testid="button-back-to-customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("customers.backToCustomers")}
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <span className="text-xl font-bold text-white">{getInitials(customer.fullName)}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="text-customer-name">
                  {customer.fullName}
                </h1>
                <p className="text-blue-100/80 text-sm font-mono mt-0.5">@{customer.username}</p>
              </div>
              <Badge 
                className={`font-normal border-0 ${customer.isActive 
                  ? "bg-emerald-500/20 text-emerald-100 backdrop-blur-sm" 
                  : "bg-red-500/20 text-red-200 backdrop-blur-sm"}`}
                data-testid="badge-customer-status"
              >
                <Shield className="h-3 w-3 mr-1" />
                {customer.isActive ? t("common.active") : t("common.inactive")}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit text-white border-white/30 bg-white/10 backdrop-blur-sm" 
              onClick={() => setEditDialogOpen(true)} 
              data-testid="button-edit-customer"
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </Button>
          </div>

          {/* Stats Row inside hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white tabular-nums">{stat.value}</span>
                </div>
                <p className="text-xs text-blue-100/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact Info Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Mail className="h-4 w-4 text-white" />
              </div>
              {t("common.contacts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("common.email")}</p>
              <p className="text-sm font-medium" data-testid="text-customer-email">{customer.email}</p>
            </div>
            {customer.phone && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("common.phone")}</p>
                <p className="text-sm font-medium" data-testid="text-customer-phone">{customer.phone}</p>
              </div>
            )}
            {subReseller && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("roles.subReseller")}</p>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium" data-testid="text-customer-sub-reseller">{subReseller.fullName}</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("admin.common.registeredOn")}</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium" data-testid="text-customer-created">
                  {format(new Date(customer.createdAt), "dd MMMM yyyy", { locale: dateLocale })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Card */}
        {billingData ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-wrap items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                {t("settings.billing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {billingData.companyName && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("auth.companyName")}</p>
                  <p className="text-sm font-semibold" data-testid="text-billing-company">{billingData.companyName}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingData.fiscalCode && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("customers.fiscalCode")}</p>
                    <p className="text-sm font-mono font-medium" data-testid="text-billing-cf">{billingData.fiscalCode}</p>
                  </div>
                )}
                {billingData.vatNumber && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("customers.vatNumber")}</p>
                    <p className="text-sm font-mono font-medium" data-testid="text-billing-piva">{billingData.vatNumber}</p>
                  </div>
                )}
              </div>
              {billingData.address && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("common.address")}</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium" data-testid="text-billing-address">
                      {billingData.address}
                      {billingData.zipCode && `, ${billingData.zipCode}`}
                      {billingData.city && ` ${billingData.city}`}
                    </p>
                  </div>
                </div>
              )}
              {(billingData.pec || billingData.codiceUnivoco) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {billingData.pec && (
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("common.pec")}</p>
                      <p className="text-sm truncate font-medium" data-testid="text-billing-pec">{billingData.pec}</p>
                    </div>
                  )}
                  {billingData.codiceUnivoco && (
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("customers.sdiCode")}</p>
                      <p className="text-sm font-mono font-medium" data-testid="text-billing-sdi">{billingData.codiceUnivoco}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-wrap items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                {t("settings.billing")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t("customers.noBillingData")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="repairs" className="w-full">
          <div className="px-4 sm:px-6 pt-6">
            <TabsList className="grid w-full grid-cols-4 h-11 bg-muted rounded-xl p-1">
              <TabsTrigger value="repairs" className="rounded-lg gap-1.5 text-xs sm:text-sm" data-testid="tab-repairs">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("repairs.title")}</span>
                <Badge variant="secondary" className="ml-0.5">{repairOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg gap-1.5 text-xs sm:text-sm" data-testid="tab-orders">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("common.orders")}</span>
                <Badge variant="secondary" className="ml-0.5">{salesOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="utility" className="rounded-lg gap-1.5 text-xs sm:text-sm" data-testid="tab-utility">
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("utility.title")}</span>
                <Badge variant="secondary" className="ml-0.5">{utilityPractices.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="relationships" className="rounded-lg gap-1.5 text-xs sm:text-sm" data-testid="tab-relationships">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("customers.relationships")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="repairs" className="mt-0 px-0">
            <CardContent className="p-0">
              {repairOrders.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Wrench className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("customers.noRepairs")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">ID</TableHead>
                        <TableHead>{t("repairs.device")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("repairs.issue")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t("common.date")}</TableHead>
                        <TableHead className="pr-6 text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <TableRow key={order.id} className="hover-elevate" data-testid={`row-repair-${order.id}`}>
                            <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                              {order.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{order.brand}</span>
                              <span className="text-muted-foreground ml-1 text-sm">{order.deviceModel}</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground text-sm">
                              {order.issueDescription}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                className="font-normal text-xs"
                                style={{ 
                                  backgroundColor: (statusConfig?.color || '#888') + "15",
                                  color: statusConfig?.color || '#888'
                                }}
                              >
                                {t(statusConfig?.labelKey || '') || statusConfig?.label || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), "dd/MM/yy")}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <Link href={`/reseller/repairs/${order.id}`}>
                                <Button variant="ghost" size="sm" data-testid={`button-view-repair-${order.id}`}>
                                  {t("common.details")}
                                  <ChevronRight className="h-4 w-4 ml-1" />
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
          </TabsContent>

          <TabsContent value="orders" className="mt-0 px-0">
            <CardContent className="p-0">
              {salesOrders.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("customers.noOrders")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">{t("common.order")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.total")}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t("common.date")}</TableHead>
                        <TableHead className="pr-6 text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map((order) => (
                        <TableRow key={order.id} className="hover-elevate" data-testid={`row-order-${order.id}`}>
                          <TableCell className="pl-6 font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">{order.status}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums font-medium">
                            &euro;{Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Link href={`/reseller/sales-orders/${order.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
                                {t("common.details")}
                                <ChevronRight className="h-4 w-4 ml-1" />
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
          </TabsContent>

          <TabsContent value="utility" className="mt-0 px-0">
            <CardContent className="p-0">
              {utilityPractices.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("customers.noUtilityPractices")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">{t("utility.practice")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("common.supplier")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("common.service")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t("common.date")}</TableHead>
                        <TableHead className="pr-6 text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {utilityPractices.map((practice) => (
                        <TableRow key={practice.id} className="hover-elevate" data-testid={`row-utility-${practice.id}`}>
                          <TableCell className="pl-6 font-mono text-sm">{practice.practiceNumber}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{practice.supplierName || practice.temporarySupplierName || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{practice.serviceName || practice.customServiceName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">{practice.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {format(new Date(practice.createdAt), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Link href={`/reseller/utility/practices/${practice.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-utility-${practice.id}`}>
                                {t("common.details")}
                                <ChevronRight className="h-4 w-4 ml-1" />
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
          </TabsContent>

          <TabsContent value="relationships" className="mt-0">
            <div className="p-4 sm:p-6">
              <CustomerRelationshipsCard customerId={customerId} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("customers.editCustomer")}</DialogTitle>
          </DialogHeader>
          <CustomerEditForm
            customer={customer}
            billingData={billingData}
            repairCenters={repairCenters}
            onSave={(formData) => updateCustomerMutation.mutate(formData)}
            onCancel={() => setEditDialogOpen(false)}
            isPending={updateCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type CustomerWithRepairCenters = User & {
  assignedRepairCenters?: RepairCenter[];
};

function CustomerEditForm({
  customer,
  billingData,
  repairCenters,
  onSave,
  onCancel,
  isPending,
}: {
  customer: CustomerWithRepairCenters;
  billingData?: BillingData | null;
  repairCenters: RepairCenter[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    username: customer.username,
    email: customer.email,
    phone: customer.phone || "",
    isActive: customer.isActive,
    repairCenterIds: customer.assignedRepairCenters?.map(rc => rc.id) || [],
    password: "",
    billingData: {
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
    },
  });

  const isCompany = formData.billingData.customerType === "company";

  const toggleRepairCenter = (centerId: string) => {
    setFormData(prev => ({
      ...prev,
      repairCenterIds: prev.repairCenterIds.includes(centerId)
        ? prev.repairCenterIds.filter(id => id !== centerId)
        : [...prev.repairCenterIds, centerId],
    }));
  };

  const updateBilling = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingData: { ...prev.billingData, [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...formData,
      password: formData.password || undefined,
    };
    if (!formData.password) delete payload.password;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          {t("customers.accountData")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("customers.fullName")} *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              data-testid="input-edit-fullName"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              data-testid="input-edit-username"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-edit-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("common.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-edit-phone"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex flex-wrap items-center gap-2">
            <Key className="h-3 w-3" />
            {t("customers.newPasswordHint")}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t("customers.minChars", { count: 8 })}
            data-testid="input-edit-password"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="isActive">{t("customers.activeCustomer")}</Label>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="input-edit-isActive"
          />
        </div>
      </div>

      {/* Billing Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          {t("customers.billingData")}
        </div>
        <div className="flex gap-4">
          <Label className="flex flex-wrap items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              checked={!isCompany}
              onChange={() => updateBilling("customerType", "private")}
              data-testid="radio-private"
            />{t("customers.individual")}</Label>
          <Label className="flex flex-wrap items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              checked={isCompany}
              onChange={() => updateBilling("customerType", "company")}
              data-testid="radio-company"
            />{t("common.company")}</Label>
        </div>

        {isCompany && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("auth.companyName")}</Label>
              <Input
                id="companyName"
                value={formData.billingData.companyName}
                onChange={(e) => updateBilling("companyName", e.target.value)}
                data-testid="input-edit-companyName"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatNumber">{t("customers.vatNumber")}</Label>
                <Input
                  id="vatNumber"
                  value={formData.billingData.vatNumber}
                  onChange={(e) => updateBilling("vatNumber", e.target.value)}
                  data-testid="input-edit-vatNumber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalCode">{t("common.taxCode")}</Label>
                <Input
                  id="fiscalCode"
                  value={formData.billingData.fiscalCode}
                  onChange={(e) => updateBilling("fiscalCode", e.target.value)}
                  data-testid="input-edit-fiscalCode"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pec">{t("common.pec")}</Label>
                <Input
                  id="pec"
                  type="email"
                  value={formData.billingData.pec}
                  onChange={(e) => updateBilling("pec", e.target.value)}
                  data-testid="input-edit-pec"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codiceUnivoco">{t("customers.sdiCode")}</Label>
                <Input
                  id="codiceUnivoco"
                  value={formData.billingData.codiceUnivoco}
                  onChange={(e) => updateBilling("codiceUnivoco", e.target.value)}
                  maxLength={7}
                  data-testid="input-edit-codiceUnivoco"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="iban">{t("profile.iban")}</Label>
          <Input
            id="iban"
            value={formData.billingData.iban}
            onChange={(e) => updateBilling("iban", e.target.value)}
            data-testid="input-edit-iban"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" />{t("common.address")}</div>
        <div className="space-y-2">
          <Label htmlFor="address">{t("customers.streetAddress")}</Label>
          <Input
            id="address"
            value={formData.billingData.address}
            onChange={(e) => updateBilling("address", e.target.value)}
            data-testid="input-edit-address"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{t("common.city")}</Label>
            <Input
              id="city"
              value={formData.billingData.city}
              onChange={(e) => updateBilling("city", e.target.value)}
              data-testid="input-edit-city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">{t("common.zip")}</Label>
            <Input
              id="zipCode"
              value={formData.billingData.zipCode}
              onChange={(e) => updateBilling("zipCode", e.target.value)}
              data-testid="input-edit-zipCode"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{t("common.country")}</Label>
            <Input
              id="country"
              value={formData.billingData.country}
              onChange={(e) => updateBilling("country", e.target.value)}
              data-testid="input-edit-country"
            />
          </div>
        </div>
      </div>

      {/* Repair Centers */}
      {repairCenters.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <Label>{t("sidebar.items.repairCentersShort")}</Label>
          <div className="flex flex-wrap gap-2">
            {repairCenters.map((rc) => {
              const isSelected = formData.repairCenterIds.includes(rc.id);
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
          </div>
        </div>
      )}

      <DialogFooter className="gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("profile.saving") : t("profile.saveChanges")}
        </Button>
      </DialogFooter>
    </form>
  );
}
