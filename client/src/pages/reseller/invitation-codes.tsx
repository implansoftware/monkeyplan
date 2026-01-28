import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Ticket, 
  Copy, 
  Trash2, 
  Edit, 
  Store, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface InvitationCode {
  id: string;
  code: string;
  repairCenterId: string;
  resellerId: string;
  description: string | null;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  repairCenterName?: string;
}

interface RepairCenter {
  id: string;
  name: string;
  city: string;
}

export default function InvitationCodesPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<InvitationCode | null>(null);
  const [filterCenterId, setFilterCenterId] = useState<string>("all");

  const [formData, setFormData] = useState({
    repairCenterId: "",
    code: "",
    description: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
  });

  const { data: codes = [], isLoading, refetch } = useQuery<InvitationCode[]>({
    queryKey: ["/api/reseller/invitation-codes"],
  });

  const { data: centers = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/reseller/invitation-codes", {
        ...data,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        expiresAt: data.expiresAt || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Codice creato", description: "Il codice invito è stato creato con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/invitation-codes"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/reseller/invitation-codes/${id}`, {
        ...data,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        expiresAt: data.expiresAt || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Codice aggiornato", description: "Il codice invito è stato aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/invitation-codes"] });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/invitation-codes/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Codice eliminato", description: "Il codice invito è stato eliminato" });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/invitation-codes"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      repairCenterId: "",
      code: "",
      description: "",
      usageLimit: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiato", description: "Codice copiato negli appunti" });
  };

  const filteredCodes = filterCenterId === "all" 
    ? codes 
    : codes.filter(c => c.repairCenterId === filterCenterId);

  const openEditDialog = (code: InvitationCode) => {
    setEditingCode(code);
    setFormData({
      repairCenterId: code.repairCenterId,
      code: code.code,
      description: code.description || "",
      usageLimit: code.usageLimit?.toString() || "",
      expiresAt: code.expiresAt ? code.expiresAt.split("T")[0] : "",
      isActive: code.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Codici Invito</h1>
          <p className="text-muted-foreground">Genera codici per associare nuovi clienti ai tuoi centri</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-refresh-codes">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-code">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Codice
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Label>Filtra per centro:</Label>
          <Select value={filterCenterId} onValueChange={setFilterCenterId}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-center">
              <SelectValue placeholder="Tutti i centri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i centri</SelectItem>
              {centers.map(center => (
                <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Ticket className="w-4 h-4" />
          <span>{filteredCodes.length} codici</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCodes.map(code => (
          <Card key={code.id} className={`${!code.isActive ? 'opacity-60' : ''}`} data-testid={`card-code-${code.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                </div>
                <Badge variant={code.isActive ? "default" : "secondary"}>
                  {code.isActive ? "Attivo" : "Disattivato"}
                </Badge>
              </div>
              {code.description && (
                <CardDescription>{code.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span>{code.repairCenterName || "Centro"}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex flex-wrap items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{code.usageCount}</span>
                  {code.usageLimit && <span className="text-muted-foreground">/ {code.usageLimit}</span>}
                </div>
                
                {code.expiresAt && (
                  <div className="flex flex-wrap items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className={new Date(code.expiresAt) < new Date() ? "text-red-500" : ""}>
                      {format(new Date(code.expiresAt), "d MMM yyyy", { locale: it })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(code.code)} data-testid={`button-copy-${code.id}`}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copia
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditDialog(code)} data-testid={`button-edit-${code.id}`}>
                  <Edit className="w-4 h-4 mr-1" />
                  Modifica
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600"
                  onClick={() => {
                    if (confirm("Eliminare questo codice invito?")) {
                      deleteMutation.mutate(code.id);
                    }
                  }}
                  data-testid={`button-delete-${code.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <Card className="p-8 text-center">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">Nessun codice invito</h3>
          <p className="text-sm text-muted-foreground mt-1">Crea il tuo primo codice per iniziare ad acquisire clienti</p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crea Codice
          </Button>
        </Card>
      )}

      <Dialog open={showCreateDialog || !!editingCode} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingCode(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? "Modifica Codice Invito" : "Nuovo Codice Invito"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!editingCode && (
              <div className="space-y-2">
                <Label>Centro di Riparazione *</Label>
                <Select value={formData.repairCenterId} onValueChange={(v) => setFormData({ ...formData, repairCenterId: v })}>
                  <SelectTrigger className="w-full" data-testid="select-center">
                    <SelectValue placeholder="Seleziona centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name} - {center.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Codice *</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Es. CENTRO-ABC123"
                  className="flex-1 uppercase font-mono"
                  disabled={!!editingCode}
                  data-testid="input-code"
                />
                {!editingCode && (
                  <Button type="button" variant="outline" onClick={generateRandomCode} data-testid="button-generate-code">
                    Genera
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Es. Campagna social media"
                data-testid="input-description"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite utilizzi</Label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Illimitato"
                  min="1"
                  data-testid="input-usage-limit"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Scadenza</Label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  data-testid="input-expires-at"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label>Codice attivo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingCode(null);
              resetForm();
            }}>
              Annulla
            </Button>
            <Button 
              onClick={() => {
                if (editingCode) {
                  updateMutation.mutate({ id: editingCode.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending || (!editingCode && (!formData.repairCenterId || !formData.code))}
              data-testid="button-save-code"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCode ? "Salva Modifiche" : "Crea Codice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
