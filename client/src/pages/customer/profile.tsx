import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Phone, Building2, MapPin, FileText, Save, X, Pencil } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function CustomerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingFiscal, setIsEditingFiscal] = useState(false);

  const [personalData, setPersonalData] = useState({
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
    pec: user?.pec || "",
    codiceUnivoco: user?.codiceUnivoco || "",
  });

  const { data: profile, isLoading } = useQuery<UserType>({
    queryKey: ["/api/customer/profile"],
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      const res = await apiRequest("PATCH", "/api/customer/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser: UserType) => {
      queryClient.setQueryData(["/api/customer/profile"], updatedUser);
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditingPersonal(false);
      setIsEditingFiscal(false);
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(personalData);
  };

  const handleFiscalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(fiscalData);
  };

  const handleCancelPersonal = () => {
    setPersonalData({
      fullName: profile?.fullName || user?.fullName || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || user?.phone || "",
    });
    setIsEditingPersonal(false);
  };

  const handleCancelFiscal = () => {
    setFiscalData({
      ragioneSociale: profile?.ragioneSociale || user?.ragioneSociale || "",
      partitaIva: profile?.partitaIva || user?.partitaIva || "",
      codiceFiscale: profile?.codiceFiscale || user?.codiceFiscale || "",
      indirizzo: profile?.indirizzo || user?.indirizzo || "",
      citta: profile?.citta || user?.citta || "",
      cap: profile?.cap || user?.cap || "",
      provincia: profile?.provincia || user?.provincia || "",
      pec: profile?.pec || user?.pec || "",
      codiceUnivoco: profile?.codiceUnivoco || user?.codiceUnivoco || "",
    });
    setIsEditingFiscal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-profile-title">
                {displayUser?.fullName || displayUser?.username}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30" data-testid="badge-role">Cliente</Badge>
                {displayUser?.isActive ? (
                  <Badge variant="default" className="bg-green-400/80 text-white" data-testid="badge-status">Attivo</Badge>
                ) : (
                  <Badge variant="destructive" data-testid="badge-status">Inattivo</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dati Personali
            </CardTitle>
            <CardDescription>
              Gestisci le tue informazioni personali e di contatto
            </CardDescription>
          </div>
          {!isEditingPersonal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPersonalData({
                  fullName: displayUser?.fullName || "",
                  email: displayUser?.email || "",
                  phone: displayUser?.phone || "",
                });
                setIsEditingPersonal(true);
              }}
              data-testid="button-edit-personal"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingPersonal ? (
            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                    placeholder="Nome e Cognome"
                    data-testid="input-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    placeholder="email@esempio.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    placeholder="+39 123 456 7890"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancelPersonal} data-testid="button-cancel-personal">
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-personal">
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium" data-testid="text-fullname">{displayUser?.fullName || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-email">{displayUser?.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium" data-testid="text-phone">{displayUser?.phone || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dati Fiscali
            </CardTitle>
            <CardDescription>
              Informazioni per la fatturazione
            </CardDescription>
          </div>
          {!isEditingFiscal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiscalData({
                  ragioneSociale: displayUser?.ragioneSociale || "",
                  partitaIva: displayUser?.partitaIva || "",
                  codiceFiscale: displayUser?.codiceFiscale || "",
                  indirizzo: displayUser?.indirizzo || "",
                  citta: displayUser?.citta || "",
                  cap: displayUser?.cap || "",
                  provincia: displayUser?.provincia || "",
                  pec: displayUser?.pec || "",
                  codiceUnivoco: displayUser?.codiceUnivoco || "",
                });
                setIsEditingFiscal(true);
              }}
              data-testid="button-edit-fiscal"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingFiscal ? (
            <form onSubmit={handleFiscalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                  <Input
                    id="ragioneSociale"
                    value={fiscalData.ragioneSociale}
                    onChange={(e) => setFiscalData({ ...fiscalData, ragioneSociale: e.target.value })}
                    placeholder="Nome Azienda S.r.l."
                    data-testid="input-ragione-sociale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partitaIva">Partita IVA</Label>
                  <Input
                    id="partitaIva"
                    value={fiscalData.partitaIva}
                    onChange={(e) => setFiscalData({ ...fiscalData, partitaIva: e.target.value })}
                    placeholder="IT12345678901"
                    data-testid="input-partita-iva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                  <Input
                    id="codiceFiscale"
                    value={fiscalData.codiceFiscale}
                    onChange={(e) => setFiscalData({ ...fiscalData, codiceFiscale: e.target.value })}
                    placeholder="RSSMRA80A01H501U"
                    data-testid="input-codice-fiscale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indirizzo">Indirizzo</Label>
                  <Input
                    id="indirizzo"
                    value={fiscalData.indirizzo}
                    onChange={(e) => setFiscalData({ ...fiscalData, indirizzo: e.target.value })}
                    placeholder="Via Roma 123"
                    data-testid="input-indirizzo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citta">Città</Label>
                  <Input
                    id="citta"
                    value={fiscalData.citta}
                    onChange={(e) => setFiscalData({ ...fiscalData, citta: e.target.value })}
                    placeholder="Milano"
                    data-testid="input-citta"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="cap">CAP</Label>
                    <Input
                      id="cap"
                      value={fiscalData.cap}
                      onChange={(e) => setFiscalData({ ...fiscalData, cap: e.target.value })}
                      placeholder="20100"
                      data-testid="input-cap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      value={fiscalData.provincia}
                      onChange={(e) => setFiscalData({ ...fiscalData, provincia: e.target.value })}
                      placeholder="MI"
                      data-testid="input-provincia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pec">PEC</Label>
                  <Input
                    id="pec"
                    type="email"
                    value={fiscalData.pec}
                    onChange={(e) => setFiscalData({ ...fiscalData, pec: e.target.value })}
                    placeholder="azienda@pec.it"
                    data-testid="input-pec"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codiceUnivoco">Codice Univoco SDI</Label>
                  <Input
                    id="codiceUnivoco"
                    value={fiscalData.codiceUnivoco}
                    onChange={(e) => setFiscalData({ ...fiscalData, codiceUnivoco: e.target.value })}
                    placeholder="ABC1234"
                    data-testid="input-codice-univoco"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancelFiscal} data-testid="button-cancel-fiscal">
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-fiscal">
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                  <p className="font-medium" data-testid="text-ragione-sociale">{displayUser?.ragioneSociale || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Partita IVA</p>
                  <p className="font-medium" data-testid="text-partita-iva">{displayUser?.partitaIva || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                  <p className="font-medium" data-testid="text-codice-fiscale">{displayUser?.codiceFiscale || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Indirizzo</p>
                  <p className="font-medium" data-testid="text-indirizzo">
                    {displayUser?.indirizzo 
                      ? `${displayUser.indirizzo}, ${displayUser.cap || ""} ${displayUser.citta || ""} (${displayUser.provincia || ""})`
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">PEC</p>
                  <p className="font-medium" data-testid="text-pec">{displayUser?.pec || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Codice Univoco SDI</p>
                  <p className="font-medium" data-testid="text-codice-univoco">{displayUser?.codiceUnivoco || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
