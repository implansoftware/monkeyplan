import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Upload, Trash2, Building2, FileText, Phone, MapPin, CreditCard, UserCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  usePageTitle(t("profile.title"));
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingFiscal, setIsEditingFiscal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [fiscalData, setFiscalData] = useState({
    ragioneSociale: user?.ragioneSociale || "",
    partitaIva: user?.partitaIva || "",
    codiceFiscale: user?.codiceFiscale || "",
    indirizzo: user?.indirizzo || "",
    citta: user?.citta || "",
    cap: user?.cap || "",
    provincia: user?.provincia || "",
    iban: user?.iban || "",
    codiceUnivoco: user?.codiceUnivoco || "",
    pec: user?.pec || "",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: UserType) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
      setIsEditingFiscal(false);
      toast({
        title: t("profile.profileUpdatedTitle"),
        description: t("profile.changesSaved"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("profile.unsupportedFormat"),
        description: t("profile.unsupportedFormatDesc"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("profile.fileTooLarge"),
        description: t("profile.fileTooLargeDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      // Determine endpoint based on user role and sub-reseller status
      let endpoint = `/api/resellers/${user.id}/logo`;
      if (user.role === 'repair_center') {
        endpoint = `/api/repair-centers/${user.id}/logo`;
      } else if (user.role === 'reseller' && (user as any).parentResellerId) {
        // Sub-reseller uses different endpoint
        endpoint = `/api/sub-resellers/${user.id}/logo`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("profile.logoUploaded"),
        description: t("profile.logoUploadedDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("profile.error"),
        description: error.message || t("profile.uploadError"),
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!user) return;
    
    try {
      // Determine endpoint based on user role and sub-reseller status
      let endpoint = `/api/resellers/${user.id}/logo`;
      if (user.role === 'repair_center') {
        endpoint = `/api/repair-centers/${user.id}/logo`;
      } else if (user.role === 'reseller' && (user as any).parentResellerId) {
        // Sub-reseller uses different endpoint
        endpoint = `/api/sub-resellers/${user.id}/logo`;
      }

      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("profile.logoRemoved"),
        description: t("profile.logoRemovedDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("profile.error"),
        description: error.message || t("profile.deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  const handleFiscalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(fiscalData);
  };

  const handleFiscalCancel = () => {
    setFiscalData({
      ragioneSociale: user?.ragioneSociale || "",
      partitaIva: user?.partitaIva || "",
      codiceFiscale: user?.codiceFiscale || "",
      indirizzo: user?.indirizzo || "",
      citta: user?.citta || "",
      cap: user?.cap || "",
      provincia: user?.provincia || "",
      iban: user?.iban || "",
      codiceUnivoco: user?.codiceUnivoco || "",
      pec: user?.pec || "",
    });
    setIsEditingFiscal(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "reseller": return "secondary";
      case "repair_center": return "outline";
      case "customer": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return t("roles.admin");
      case "reseller": return t("roles.reseller");
      case "repair_center": return t("roles.repairCenter");
      case "customer": return t("roles.customer");
      default: return role;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t("profile.loadingProfile")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* Hero Header - Modern Glass Style */}
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("profile.myProfile")}</h1>
              <p className="text-sm text-white/80">
                {t("profile.manageAccount")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("profile.accountInfo")}</CardTitle>
              <CardDescription>{t("profile.accountInfoDesc")}</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                {t("profile.edit")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="flex flex-wrap items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="bg-muted"
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.usernameNotEditable")}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  required
                  data-testid="input-fullname"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="flex flex-wrap items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone" className="flex flex-wrap items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("profile.phone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  data-testid="input-phone"
                />
              </div>

              <div className="grid gap-2">
                <Label className="flex flex-wrap items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("profile.role")}
                </Label>
                <div>
                  <Badge variant={getRoleBadgeVariant(user.role)} data-testid="badge-role">
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.roleAssigned")}
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  {t("profile.cancel")}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {(user.role === "reseller" || user.role === "repair_center") && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("profile.companyLogo")}
            </CardTitle>
            <CardDescription>
              {t("profile.companyLogoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <Avatar className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25">
                {user.logoUrl ? (
                  <AvatarImage src={user.logoUrl} alt="Logo aziendale" className="object-contain" />
                ) : null}
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                  <Building2 className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingLogo ? t("profile.uploadingLogo") : user.logoUrl ? t("profile.changeLogo") : t("profile.uploadLogo")}
                  </Button>
                  {user.logoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteLogo}
                      className="text-destructive hover:text-destructive"
                      data-testid="button-delete-logo"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("profile.removeLogo")}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.supportedFormats")}
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                data-testid="input-logo-file"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "reseller" && (
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("profile.fiscalTitle")}
                </CardTitle>
                <CardDescription>{t("profile.fiscalInfoDesc")}</CardDescription>
              </div>
              {!isEditingFiscal && (
                <Button onClick={() => setIsEditingFiscal(true)} data-testid="button-edit-fiscal">
                  {t("profile.edit")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFiscalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="ragioneSociale">{t("profile.ragioneSociale")}</Label>
                  <Input
                    id="ragioneSociale"
                    value={fiscalData.ragioneSociale}
                    onChange={(e) => setFiscalData({ ...fiscalData, ragioneSociale: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    data-testid="input-ragioneSociale"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="partitaIva">{t("profile.partitaIva")}</Label>
                  <Input
                    id="partitaIva"
                    value={fiscalData.partitaIva}
                    onChange={(e) => setFiscalData({ ...fiscalData, partitaIva: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    data-testid="input-partitaIva"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="codiceFiscale">{t("profile.codiceFiscale")}</Label>
                  <Input
                    id="codiceFiscale"
                    value={fiscalData.codiceFiscale}
                    onChange={(e) => setFiscalData({ ...fiscalData, codiceFiscale: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    data-testid="input-codiceFiscale"
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="indirizzo" className="flex flex-wrap items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("profile.indirizzo")}
                  </Label>
                  <Input
                    id="indirizzo"
                    value={fiscalData.indirizzo}
                    onChange={(e) => setFiscalData({ ...fiscalData, indirizzo: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    data-testid="input-indirizzo"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="citta">{t("profile.citta")}</Label>
                  <Input
                    id="citta"
                    value={fiscalData.citta}
                    onChange={(e) => setFiscalData({ ...fiscalData, citta: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    data-testid="input-citta"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="cap">{t("profile.cap")}</Label>
                    <Input
                      id="cap"
                      value={fiscalData.cap}
                      onChange={(e) => setFiscalData({ ...fiscalData, cap: e.target.value })}
                      disabled={!isEditingFiscal}
                      className={!isEditingFiscal ? "bg-muted" : ""}
                      data-testid="input-cap"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provincia">{t("profile.provincia")}</Label>
                    <Input
                      id="provincia"
                      value={fiscalData.provincia}
                      onChange={(e) => setFiscalData({ ...fiscalData, provincia: e.target.value })}
                      disabled={!isEditingFiscal}
                      className={!isEditingFiscal ? "bg-muted" : ""}
                      maxLength={2}
                      placeholder="ES: MI"
                      data-testid="input-provincia"
                    />
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="iban" className="flex flex-wrap items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    IBAN
                  </Label>
                  <Input
                    id="iban"
                    value={fiscalData.iban}
                    onChange={(e) => setFiscalData({ ...fiscalData, iban: e.target.value.toUpperCase() })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    placeholder="IT00X0000000000000000000000"
                    data-testid="input-iban"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="codiceUnivoco">{t("profile.codiceUnivoco")}</Label>
                  <Input
                    id="codiceUnivoco"
                    value={fiscalData.codiceUnivoco}
                    onChange={(e) => setFiscalData({ ...fiscalData, codiceUnivoco: e.target.value.toUpperCase() })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    maxLength={7}
                    placeholder="0000000"
                    data-testid="input-codiceUnivoco"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pec">PEC</Label>
                  <Input
                    id="pec"
                    type="email"
                    value={fiscalData.pec}
                    onChange={(e) => setFiscalData({ ...fiscalData, pec: e.target.value })}
                    disabled={!isEditingFiscal}
                    className={!isEditingFiscal ? "bg-muted" : ""}
                    placeholder="esempio@pec.it"
                    data-testid="input-pec"
                  />
                </div>
              </div>

              {isEditingFiscal && (
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-fiscal"
                  >
                    {updateMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFiscalCancel}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel-fiscal"
                  >
                    {t("profile.cancel")}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t("profile.securityInfo")}</CardTitle>
          <CardDescription>{t("profile.securityInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("profile.securityTip1")}</p>
            <p>{t("profile.securityTip2")}</p>
            <p>{t("profile.securityTip3")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
