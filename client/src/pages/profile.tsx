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
import { User, Mail, Shield, Upload, Trash2, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string }) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: UserType) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato non supportato",
        description: "Usa un'immagine JPEG, PNG o WebP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "L'immagine non può superare i 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/resellers/${user.id}/logo`, {
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
        title: "Logo caricato",
        description: "Il logo è stato aggiornato con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il logo",
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
      const res = await fetch(`/api/resellers/${user.id}/logo`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Logo rimosso",
        description: "Il logo è stato eliminato",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il logo",
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
    });
    setIsEditing(false);
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
      case "admin": return "Amministratore";
      case "reseller": return "Rivenditore";
      case "repair_center": return "Centro Riparazione";
      case "customer": return "Cliente";
      default: return role;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Caricamento profilo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Il Mio Profilo</h1>
        <p className="text-muted-foreground">Gestisci le informazioni del tuo account</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informazioni Account</CardTitle>
              <CardDescription>Visualizza e modifica i tuoi dati personali</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                Modifica
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="flex items-center gap-2">
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
                  Il nome utente non può essere modificato
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">Nome Completo</Label>
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
                <Label htmlFor="email" className="flex items-center gap-2">
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
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ruolo
                </Label>
                <div>
                  <Badge variant={getRoleBadgeVariant(user.role)} data-testid="badge-role">
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Il ruolo è assegnato dall'amministratore
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
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Annulla
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {user.role === "reseller" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Logo Aziendale
            </CardTitle>
            <CardDescription>
              Carica il logo della tua azienda per personalizzare la tua presenza sulla piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
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
                    {isUploadingLogo ? "Caricamento..." : user.logoUrl ? "Cambia Logo" : "Carica Logo"}
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
                      Rimuovi
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formati supportati: JPEG, PNG, WebP. Dimensione massima: 2MB
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

      <Card>
        <CardHeader>
          <CardTitle>Sicurezza Account</CardTitle>
          <CardDescription>Informazioni sulla sicurezza del tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Per modificare la password, contatta l'amministratore del sistema</p>
            <p>• Mantieni sempre aggiornati i tuoi dati di contatto</p>
            <p>• Non condividere le tue credenziali con altre persone</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
