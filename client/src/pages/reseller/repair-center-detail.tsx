import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { RepairCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Phone, Mail, Building, ChevronLeft, ChevronRight, Check, FileText, Users, Eye, Wrench, Euro, TrendingUp, Loader2, BarChart3, User2, AlertCircle, Upload, ImageIcon, MapPin, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

type RepairCenterDetailData = {
  center: RepairCenter;
  stats: {
    totalRepairs: number;
    pendingRepairs: number;
    completedRepairs: number;
    inProgressRepairs: number;
    totalRevenue: number;
    staffCount: number;
    customerCount: number;
  };
  recentRepairs: {
    id: string;
    orderNumber: string;
    status: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string;
    issueDescription: string;
    finalCost: number | null;
    estimatedCost: number | null;
    createdAt: string;
    customerName: string | null;
    customerEmail: string | null;
  }[];
};

type RepairCenterRepairsData = {
  repairs: {
    id: string;
    orderNumber: string;
    status: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string;
    issueDescription: string;
    finalCost: number | null;
    estimatedCost: number | null;
    createdAt: string;
    updatedAt: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
  }[];
  total: number;
};

export default function ResellerRepairCenterDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [repairsPage, setRepairsPage] = useState(0);
  const [repairsStatusFilter, setRepairsStatusFilter] = useState<string>("all");

  const { data: centerDetail, isLoading: isLoadingDetail } = useQuery<RepairCenterDetailData>({
    queryKey: ["/api/reseller/repair-centers", id, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/repair-centers/${id}/detail`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  const { data: repairsData, isLoading: isLoadingRepairs } = useQuery<RepairCenterRepairsData>({
    queryKey: ["/api/reseller/repair-centers", id, "repairs", repairsPage, repairsStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", offset: String(repairsPage * 20) });
      if (repairsStatusFilter !== "all") params.set("status", repairsStatusFilter);
      const res = await fetch(`/api/reseller/repair-centers/${id}/repairs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: t("common.pending"), variant: "secondary" },
      ingressato: { label: t("repairs.status.received"), variant: "outline" },
      in_diagnosi: { label: t("repairs.status.inDiagnosis"), variant: "outline" },
      preventivo_emesso: { label: t("repairs.preventivoEmesso"), variant: "outline" },
      preventivo_accettato: { label: t("repairs.preventivoAccettato"), variant: "default" },
      attesa_ricambi: { label: t("repairs.status.waitingParts"), variant: "secondary" },
      in_riparazione: { label: t("repairs.status.inRepair"), variant: "default" },
      in_test: { label: t("repairs.status.inTest"), variant: "default" },
      pronto_ritiro: { label: t("repairs.readyForPickup"), variant: "default" },
      consegnato: { label: t("repairs.status.delivered"), variant: "default" },
      cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCenterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: t("profile.unsupportedFormat"), description: t("profile.unsupportedFormatDesc"), variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("profile.fileTooLarge"), description: t("profile.fileTooLargeDesc"), variant: "destructive" });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`/api/repair-centers/${id}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers", id, "detail"] });
      toast({ title: t("profile.logoUploaded"), description: t("profile.logoUploadedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("admin.repairCenters.logoUploadError"), variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleDeleteCenterLogo = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/repair-centers/${id}/logo`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers", id, "detail"] });
      toast({ title: t("profile.logoRemoved"), description: t("profile.logoRemovedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("admin.repairCenters.logoDeleteError"), variant: "destructive" });
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!centerDetail) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" onClick={() => setLocation("/reseller/repair-centers")} data-testid="button-back-to-centers">
          <ArrowLeft className="h-4 w-4 mr-2" />{t("common.back")}
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>{t("repairs.cannotLoadCenterData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/reseller/repair-centers")} data-testid="button-back-to-centers">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <Building className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-semibold">{centerDetail.center.name}</span>
          {centerDetail.center.isActive !== undefined && (
            <Badge variant={centerDetail.center.isActive ? "default" : "secondary"}>
              {centerDetail.center.isActive ? t("common.active") : t("common.inactive")}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="anagrafica" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="anagrafica" className="flex flex-wrap items-center gap-2" data-testid="tab-anagrafica">
            <FileText className="h-4 w-4" />{t("admin.resellers.registry")}
          </TabsTrigger>
          <TabsTrigger value="statistiche" className="flex flex-wrap items-center gap-2" data-testid="tab-statistiche">
            <BarChart3 className="h-4 w-4" />{t("dashboard.statistics")}
          </TabsTrigger>
          <TabsTrigger value="riparazioni" className="flex flex-wrap items-center gap-2" data-testid="tab-riparazioni">
            <Wrench className="h-4 w-4" />{t("repairs.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anagrafica" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-semibold">{t("profile.companyLogo")}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <Avatar className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  {centerDetail.center.logoUrl ? (
                    <AvatarImage src={centerDetail.center.logoUrl} alt={t("admin.repairCenters.centerLogoAlt")} className="object-contain" />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                    <Building className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      data-testid="button-upload-center-logo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingLogo ? t("common.loading") : centerDetail.center.logoUrl ? t("profile.changeLogo") : t("profile.uploadLogo")}
                    </Button>
                    {centerDetail.center.logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteCenterLogo}
                        className="text-destructive hover:text-destructive"
                        data-testid="button-delete-center-logo"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />{t("profile.removeLogo")}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.repairCenters.supportedFormats")}
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCenterLogoUpload}
                  className="hidden"
                  data-testid="input-center-logo-file"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold">{t("common.contacts")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{centerDetail.center.email}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{centerDetail.center.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold">{t("common.address")}</span>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{centerDetail.center.address}</p>
                <p>{centerDetail.center.cap} {centerDetail.center.city} ({centerDetail.center.provincia})</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-semibold">{t("profile.fiscalInfo")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("auth.companyName")}</p>
                    <p className="font-medium">{centerDetail.center.ragioneSociale || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("auth.vatNumber")}</p>
                    <p className="font-medium">{centerDetail.center.partitaIva || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("common.taxCode")}</p>
                    <p className="font-medium">{centerDetail.center.codiceFiscale || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("common.sdi")}</p>
                    <p className="font-medium">{centerDetail.center.codiceUnivoco || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("common.pec")}</p>
                    <p className="font-medium">{centerDetail.center.pec || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("profile.iban")}</p>
                    <p className="font-medium">{centerDetail.center.iban || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistiche" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <CardContent className="relative pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("repairs.totalRepairs")}</p>
                    <p className="text-2xl font-bold">{centerDetail.stats.totalRepairs}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <Wrench className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
              <CardContent className="relative pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("common.pending")}</p>
                    <p className="text-2xl font-bold text-amber-600">{centerDetail.stats.pendingRepairs}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
              <CardContent className="relative pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("common.inProgress")}</p>
                    <p className="text-2xl font-bold text-violet-600">{centerDetail.stats.inProgressRepairs}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500 text-white flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              <CardContent className="relative pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("common.completedFem")}</p>
                    <p className="text-2xl font-bold text-emerald-600">{centerDetail.stats.completedRepairs}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("admin.repairCenters.totalRevenue")}</p>
                    <p className="text-xl font-bold">{"\u20AC"}{(centerDetail.stats.totalRevenue / 100).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("admin.repairCenters.assignedStaff")}</p>
                    <p className="text-xl font-bold">{centerDetail.stats.staffCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{t("admin.repairCenters.customersServed")}</p>
                    <p className="text-xl font-bold">{centerDetail.stats.customerCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="riparazioni" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {t("repairs.title")} ({repairsData?.total || 0})
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={repairsStatusFilter} onValueChange={(v) => { setRepairsStatusFilter(v); setRepairsPage(0); }}>
                <SelectTrigger className="w-48" data-testid="select-repair-status-filter">
                  <SelectValue placeholder={t("common.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="ingressato">{t("repairs.status.received")}</SelectItem>
                  <SelectItem value="in_diagnosi">{t("repairs.status.inDiagnosis")}</SelectItem>
                  <SelectItem value="preventivo_emesso">{t("repairs.preventivoEmesso")}</SelectItem>
                  <SelectItem value="preventivo_accettato">{t("repairs.preventivoAccettato")}</SelectItem>
                  <SelectItem value="attesa_ricambi">{t("repairs.status.waitingParts")}</SelectItem>
                  <SelectItem value="in_riparazione">{t("repairs.status.inRepair")}</SelectItem>
                  <SelectItem value="in_test">{t("repairs.status.inTest")}</SelectItem>
                  <SelectItem value="pronto_ritiro">{t("repairs.readyForPickup")}</SelectItem>
                  <SelectItem value="consegnato">{t("repairs.status.delivered")}</SelectItem>
                  <SelectItem value="cancelled">{t("repairs.status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingRepairs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !repairsData || repairsData.repairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>{t("repairs.noRepairsFound")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.order")}</TableHead>
                    <TableHead>{t("repairs.device")}</TableHead>
                    <TableHead>{t("common.customer")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead className="text-right">{t("common.amount")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairsData.repairs.map((repair) => (
                    <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
                      <TableCell className="font-mono text-sm">{repair.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{repair.brand} {repair.deviceModel}</div>
                          <div className="text-xs text-muted-foreground">{repair.deviceType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{repair.customerName || "-"}</div>
                          <div className="text-xs text-muted-foreground">{repair.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(repair.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(repair.createdAt), "dd/MM/yyyy", { locale: it })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {repair.finalCost ? `\u20AC${(repair.finalCost / 100).toFixed(2)}` :
                         repair.estimatedCost ? `~\u20AC${(repair.estimatedCost / 100).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/reseller/repairs/${repair.id}`)}
                          data-testid={`button-view-repair-${repair.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {repairsData.total > 20 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("common.pageXofY", { current: repairsPage + 1, total: Math.ceil(repairsData.total / 20) })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRepairsPage(p => Math.max(0, p - 1))}
                      disabled={repairsPage === 0}
                      data-testid="button-prev-repairs-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />{t("table.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRepairsPage(p => p + 1)}
                      disabled={(repairsPage + 1) * 20 >= repairsData.total}
                      data-testid="button-next-repairs-page"
                    >
                      {t("table.next")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
