import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { RepairCenter, RepairOrder, User, UtilityPractice, PaymentConfiguration } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FileCheck,
  KeyRound,
  CreditCard,
  Check,
  X
} from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";

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
  const { toast } = useToast();
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading, error } = useQuery<RepairCenterOverviewResponse>({
    queryKey: ["/api/admin/repair-centers", centerId, "overview"],
    enabled: !!centerId,
  });

  const { data: paymentConfig } = useQuery<PaymentConfiguration | null>({
    queryKey: ["/api/admin/repair-centers", centerId, "payment-config"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/repair-centers/${centerId}/payment-config`);
      return await res.json();
    },
    enabled: !!centerId,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const res = await apiRequest("POST", `/api/admin/repair-centers/${centerId}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo" });
      setResetPasswordDialogOpen(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const confirmResetPassword = () => {
    if (newPassword.length >= 4) {
      resetPasswordMutation.mutate(newPassword);
    }
  };

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10">
          <Link href="/admin/repair-centers">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back-to-centers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai centri
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Store className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="text-center-name">{center.name}</h1>
                <p className="text-blue-100/80 mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {center.city}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setNewPassword(""); setResetPasswordDialogOpen(true); }} className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl" data-testid="button-reset-password">
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              <Badge className={center.isActive ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30" : "bg-slate-400/20 text-slate-100 border border-slate-400/30"} data-testid="badge-center-status">
                {center.isActive ? "Attivo" : "Inattivo"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-total-repairs">{stats.totalRepairs}</p>
              <p className="text-xs text-blue-100">Lavorazioni</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-active-repairs">{stats.activeRepairs}</p>
              <p className="text-xs text-emerald-100">Attive</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-5 text-white shadow-lg shadow-cyan-500/25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-utility-practices">{stats.totalUtilityPractices}</p>
              <p className="text-xs text-cyan-100">Pratiche Utility</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg shadow-amber-500/25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-customers">{stats.totalCustomers}</p>
              <p className="text-xs text-amber-100">Clienti</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-5 text-white shadow-lg shadow-violet-500/25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-repairs-30days">{stats.repairs30Days}</p>
              <p className="text-xs text-violet-100">Ultimi 30gg</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Store className="h-5 w-5 text-white" />
              </div>
              Informazioni Centro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Indirizzo</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-center-address">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {center.address}, {center.city}
                  {center.cap && ` (${center.cap})`}
                  {center.provincia && ` ${center.provincia}`}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-center-email">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {center.email}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telefono</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-center-phone">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {center.phone}
                </p>
              </div>
              {center.hourlyRateCents && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tariffa Oraria</p>
                  <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-center-hourly-rate">
                    €{(center.hourlyRateCents / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            {reseller && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Rivenditore di appartenenza</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <Link href={`/admin/resellers/${reseller.id}`}>
                    <span className="font-semibold text-blue-600 hover:underline cursor-pointer" data-testid="link-reseller">
                      {reseller.fullName}
                    </span>
                  </Link>
                </div>
              </div>
            )}
            {subReseller && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Sub-Reseller di riferimento</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <Link href={`/admin/resellers/${subReseller.id}`}>
                    <span className="font-semibold text-blue-600 hover:underline cursor-pointer" data-testid="link-sub-reseller">
                      {subReseller.fullName}
                    </span>
                  </Link>
                  {subReseller.email && (
                    <span className="text-sm text-slate-500">({subReseller.email})</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(center.ragioneSociale || center.partitaIva) && (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Dati Fiscali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {center.ragioneSociale && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ragione Sociale</p>
                    <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-ragione-sociale">{center.ragioneSociale}</p>
                  </div>
                )}
                {center.partitaIva && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Partita IVA</p>
                    <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-partita-iva">{center.partitaIva}</p>
                  </div>
                )}
                {center.codiceFiscale && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Codice Fiscale</p>
                    <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-codice-fiscale">{center.codiceFiscale}</p>
                  </div>
                )}
                {center.codiceUnivoco && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Codice SDI</p>
                    <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-codice-sdi">{center.codiceUnivoco}</p>
                  </div>
                )}
                {center.pec && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">PEC</p>
                    <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-pec">{center.pec}</p>
                  </div>
                )}
                {center.iban && (
                  <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">IBAN</p>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm" data-testid="text-iban">{center.iban}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Configuration Card */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-wrap items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            Configurazione Pagamenti
            {paymentConfig?.useParentConfig && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" data-testid="badge-uses-parent-config">
                Usa config. rivenditore
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!paymentConfig ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center">
              <p className="text-slate-500">Non configurato</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl" data-testid="payment-stripe-status">
                <div className="flex items-center gap-2 mb-1">
                  <SiStripe className="h-4 w-4 text-[#635BFF]" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Stripe</p>
                </div>
                <div className="flex items-center gap-1">
                  {paymentConfig.stripeEnabled && paymentConfig.stripeAccountId ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={paymentConfig.stripeEnabled && paymentConfig.stripeAccountId ? "text-emerald-600 font-medium text-sm" : "text-slate-400 text-sm"}>
                    {paymentConfig.stripeEnabled && paymentConfig.stripeAccountId ? "Configurato" : "Non attivo"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl" data-testid="payment-bonifico-status">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Bonifico</p>
                </div>
                <div className="flex items-center gap-1">
                  {paymentConfig.bankTransferEnabled && paymentConfig.iban ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={paymentConfig.bankTransferEnabled && paymentConfig.iban ? "text-emerald-600 font-medium text-sm" : "text-slate-400 text-sm"}>
                    {paymentConfig.bankTransferEnabled && paymentConfig.iban ? "Configurato" : "Non attivo"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl" data-testid="payment-paypal-status">
                <div className="flex items-center gap-2 mb-1">
                  <SiPaypal className="h-4 w-4 text-[#003087]" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">PayPal</p>
                </div>
                <div className="flex items-center gap-1">
                  {paymentConfig.paypalEnabled && paymentConfig.paypalEmail ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={paymentConfig.paypalEnabled && paymentConfig.paypalEmail ? "text-emerald-600 font-medium text-sm" : "text-slate-400 text-sm"}>
                    {paymentConfig.paypalEnabled && paymentConfig.paypalEmail ? "Configurato" : "Non attivo"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl" data-testid="payment-satispay-status">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-[#FF4438]" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Satispay</p>
                </div>
                <div className="flex items-center gap-1">
                  {paymentConfig.satispayEnabled && paymentConfig.satispayShopId ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={paymentConfig.satispayEnabled && paymentConfig.satispayShopId ? "text-emerald-600 font-medium text-sm" : "text-slate-400 text-sm"}>
                    {paymentConfig.satispayEnabled && paymentConfig.satispayShopId ? "Configurato" : "Non attivo"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <TabsTrigger value="repairs" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-repairs">
            <Wrench className="h-4 w-4 mr-2" />
            Lavorazioni ({repairs.length})
          </TabsTrigger>
          <TabsTrigger value="utility" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-utility">
            <FileCheck className="h-4 w-4 mr-2" />
            Pratiche ({utilityPractices.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-orders">
            <Package className="h-4 w-4 mr-2" />
            Ordini B2B ({b2bOrders.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Clienti ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-staff">
            <Users className="h-4 w-4 mr-2" />
            Staff ({staff.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repairs" className="mt-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle>Storico Lavorazioni</CardTitle>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessuna lavorazione trovata</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Cliente</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Dispositivo</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Data Creazione</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairs.map((repair) => (
                        <TableRow key={repair.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-repair-${repair.id}`}>
                          <TableCell className="font-medium">
                            {usersMap[repair.customerId]?.fullName || "-"}
                          </TableCell>
                          <TableCell>
                            {repair.deviceType} - {repair.brand} {repair.deviceModel}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utility" className="mt-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle>Pratiche Utility</CardTitle>
            </CardHeader>
            <CardContent>
              {utilityPractices.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessuna pratica utility trovata</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Cliente</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Fornitore</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Servizio</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Importo</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Data</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {utilityPractices.map((practice) => (
                        <TableRow key={practice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-practice-${practice.id}`}>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle>Ordini B2B</CardTitle>
            </CardHeader>
            <CardContent>
              {b2bOrders.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessun ordine B2B trovato</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Numero Ordine</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Totale</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {b2bOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-order-${order.id}`}>
                          <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {B2B_STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            €{(order.totalAmountCents / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: it })}
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

        <TabsContent value="customers" className="mt-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle>Clienti Associati</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessun cliente associato</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Telefono</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-customer-${customer.id}`}>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle>Staff Assegnato</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessuno staff assegnato</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Ruolo</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-staff-${member.id}`}>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Stai per resettare la password del centro <strong className="text-slate-900 dark:text-white">{center.name}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs text-slate-500 uppercase tracking-wide">Nuova Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci nuova password (min. 4 caratteri)"
                className="h-11 rounded-xl"
                data-testid="input-new-password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
                className="rounded-xl"
                data-testid="button-cancel-reset-password"
              >
                Annulla
              </Button>
              <Button
                onClick={confirmResetPassword}
                disabled={newPassword.length < 4 || resetPasswordMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? "Aggiornamento..." : "Conferma Reset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
