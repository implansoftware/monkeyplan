import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { User, RepairCenter } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MapPin,
  KeyRound,
  Calendar,
  Activity,
  Wrench,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading, error } = useQuery<ResellerOverviewResponse>({
    queryKey: ["/api/admin/resellers", resellerId, "overview"],
    enabled: !!resellerId,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, { newPassword });
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

  const handleResetPassword = () => {
    if (resellerId && newPassword.length >= 4) {
      resetPasswordMutation.mutate({ id: resellerId, newPassword });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-reseller-detail-loading">
        <Skeleton className="h-40 w-full rounded-2xl" />
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
      <div className="space-y-6" data-testid="page-reseller-detail-error">
        <Link href="/admin/resellers">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-to-resellers">
            <ArrowLeft className="h-4 w-4" />
            Torna ai rivenditori
          </Button>
        </Link>
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <Store className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 text-lg">Rivenditore non trovato</p>
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10">
          <Link href="/admin/resellers">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back-to-resellers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai rivenditori
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="text-reseller-name">
                  {reseller.fullName}
                </h1>
                <p className="text-blue-100/80 mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {reseller.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border border-white/30 px-3 py-1" data-testid="badge-reseller-category">
                {categoryLabel}
              </Badge>
              <Badge 
                className={reseller.isActive 
                  ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 px-3 py-1" 
                  : "bg-slate-400/20 text-slate-100 border border-slate-400/30 px-3 py-1"
                } 
                data-testid="badge-reseller-status"
              >
                <Activity className="h-3 w-3 mr-1" />
                {reseller.isActive ? "Attivo" : "Inattivo"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewPassword("");
                  setResetPasswordDialogOpen(true);
                }}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                data-testid="button-reset-password"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Store className="h-5 w-5 text-white" />
              </div>
              Informazioni Rivenditore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Username</p>
                <p className="font-semibold text-slate-900 dark:text-white font-mono" data-testid="text-reseller-username">{reseller.username}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Data Registrazione</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-reseller-created">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {reseller.createdAt ? format(new Date(reseller.createdAt), "dd MMM yyyy", { locale: it }) : "-"}
                </p>
              </div>
            </div>
            
            {reseller.phone && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telefono</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-reseller-phone">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  {reseller.phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Dati Fiscali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ragione Sociale</p>
              <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-reseller-ragione-sociale">
                {reseller.ragioneSociale || "-"}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Partita IVA</p>
                <p className="font-mono text-sm text-slate-900 dark:text-white" data-testid="text-reseller-piva">
                  {reseller.partitaIva || "-"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Codice Fiscale</p>
                <p className="font-mono text-sm text-slate-900 dark:text-white" data-testid="text-reseller-cf">
                  {reseller.codiceFiscale || "-"}
                </p>
              </div>
            </div>
            
            {reseller.indirizzo && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Indirizzo</p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-reseller-address">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  {reseller.indirizzo}, {reseller.cap} {reseller.citta} ({reseller.provincia})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold" data-testid="stat-sub-resellers">{subResellers.length}</p>
              <p className="text-sm text-blue-100">Sub-Rivenditori</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold" data-testid="stat-repair-centers">{repairCenters.length}</p>
              <p className="text-sm text-emerald-100">Centri Riparazione</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold" data-testid="stat-customers">{customers.length}</p>
              <p className="text-sm text-violet-100">Clienti</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold" data-testid="stat-staff">{staff.length}</p>
              <p className="text-sm text-amber-100">Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <Tabs defaultValue="repair-centers" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-full grid grid-cols-4">
              {(reseller.resellerCategory === 'franchising' || reseller.resellerCategory === 'gdo') && (
                <TabsTrigger value="sub-resellers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-sub-resellers">
                  Sub-Riv. ({subResellers.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="repair-centers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-repair-centers">
                Centri ({repairCenters.length})
              </TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-customers">
                Clienti ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700" data-testid="tab-staff">
                Staff ({staff.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {(reseller.resellerCategory === 'franchising' || reseller.resellerCategory === 'gdo') && (
            <TabsContent value="sub-resellers" className="px-6 pb-6">
              {subResellers.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                  <Store className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nessun sub-rivenditore</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Telefono</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subResellers.map((sub) => (
                        <TableRow key={sub.id} data-testid={`row-sub-reseller-${sub.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <TableCell className="font-medium text-slate-900 dark:text-white">{sub.fullName}</TableCell>
                          <TableCell className="text-slate-500">{sub.email}</TableCell>
                          <TableCell className="text-slate-500">{sub.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge className={sub.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                              {sub.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/resellers/${sub.id}`}>
                              <Button variant="ghost" size="icon" className="hover:bg-blue-100 hover:text-blue-600" title="Visualizza dettagli">
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
          )}

          <TabsContent value="repair-centers" className="px-6 pb-6">
            {repairCenters.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessun centro riparazione</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Citta</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Telefono</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairCenters.map((rc) => (
                      <TableRow key={rc.id} data-testid={`row-repair-center-${rc.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-900 dark:text-white">{rc.name}</TableCell>
                        <TableCell className="text-slate-500">{rc.city}</TableCell>
                        <TableCell className="text-slate-500">{rc.phone}</TableCell>
                        <TableCell className="text-slate-500">{rc.email}</TableCell>
                        <TableCell>
                          <Badge className={rc.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                            {rc.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="customers" className="px-6 pb-6">
            {customers.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-4">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessun cliente</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Telefono</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-900 dark:text-white">{customer.fullName}</TableCell>
                        <TableCell className="text-slate-500">{customer.email}</TableCell>
                        <TableCell className="text-slate-500">{customer.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={customer.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                            {customer.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="hover:bg-blue-100 hover:text-blue-600" title="Visualizza dettagli">
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

          <TabsContent value="staff" className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4 mt-4">
              <h3 className="font-medium text-slate-900 dark:text-white">Membri Staff</h3>
              <Link href={`/admin/resellers/${resellerId}/team`}>
                <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-manage-team">
                  <UsersRound className="h-4 w-4 mr-2" />
                  Gestisci Team
                </Button>
              </Link>
            </div>
            {staff.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <UsersRound className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nessun membro dello staff</p>
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
                    {staff.map((member) => (
                      <TableRow key={member.id} data-testid={`row-staff-${member.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-900 dark:text-white">{member.fullName}</TableCell>
                        <TableCell className="text-slate-500">{member.email}</TableCell>
                        <TableCell className="text-slate-500">{member.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={member.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                            {member.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-reset-password">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-lg">Reset Password</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Stai per resettare la password di <strong className="text-slate-900 dark:text-white">{reseller.fullName}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">Nuova Password</Label>
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
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
                className="rounded-xl"
                data-testid="button-cancel-reset-password"
              >
                Annulla
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={newPassword.length < 4 || resetPasswordMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  "Conferma Reset"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
