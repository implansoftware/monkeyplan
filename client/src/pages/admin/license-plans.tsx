import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, CreditCard, Clock, Users, Tag } from "lucide-react";
import type { LicensePlan } from "@shared/schema";

const TARGET_LABELS: Record<string, string> = {
  all: "Tutti",
  standard: "Standard",
  franchising: "Franchising",
  gdo: "GDO",
};

const DURATION_LABELS: Record<number, string> = {
  1: "1 Mese",
  3: "3 Mesi",
  6: "6 Mesi",
  12: "12 Mesi",
};

function PlanForm({ plan, onSave, onCancel }: { plan?: LicensePlan; onSave: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(plan?.name || "");
  const [description, setDescription] = useState(plan?.description || "");
  const [targetCategory, setTargetCategory] = useState<string>(plan?.targetCategory || "all");
  const [durationMonths, setDurationMonths] = useState(String(plan?.durationMonths || "1"));
  const [priceCents, setPriceCents] = useState(String(plan ? (plan.priceCents / 100).toFixed(2) : ""));
  const [features, setFeatures] = useState(plan?.features || "");
  const [maxStaffUsers, setMaxStaffUsers] = useState(plan?.maxStaffUsers ? String(plan.maxStaffUsers) : "");
  const [isActive, setIsActive] = useState(plan?.isActive !== false);
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder || 0));

  const handleSubmit = () => {
    if (!name.trim() || !priceCents) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      targetCategory,
      durationMonths: parseInt(durationMonths),
      priceCents: Math.round(parseFloat(priceCents) * 100),
      features: features.trim() || null,
      maxStaffUsers: maxStaffUsers ? parseInt(maxStaffUsers) : null,
      isActive,
      sortOrder: parseInt(sortOrder) || 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome piano *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="es. Standard Mensile" data-testid="input-plan-name" />
      </div>
      <div className="space-y-2">
        <Label>Descrizione</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione del piano" data-testid="input-plan-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria target</Label>
          <Select value={targetCategory} onValueChange={setTargetCategory}>
            <SelectTrigger data-testid="select-target-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="franchising">Franchising</SelectItem>
              <SelectItem value="gdo">GDO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Durata</Label>
          <Select value={durationMonths} onValueChange={setDurationMonths}>
            <SelectTrigger data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Mese</SelectItem>
              <SelectItem value="3">3 Mesi</SelectItem>
              <SelectItem value="6">6 Mesi</SelectItem>
              <SelectItem value="12">12 Mesi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prezzo (EUR) *</Label>
          <Input type="number" step="0.01" value={priceCents} onChange={e => setPriceCents(e.target.value)} placeholder="29.99" data-testid="input-plan-price" />
        </div>
        <div className="space-y-2">
          <Label>Max utenti staff</Label>
          <Input type="number" value={maxStaffUsers} onChange={e => setMaxStaffUsers(e.target.value)} placeholder="Illimitati" data-testid="input-max-staff" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Funzionalità incluse (una per riga)</Label>
        <Textarea value={features} onChange={e => setFeatures(e.target.value)} placeholder="Gestione riparazioni&#10;Magazzino&#10;Fatturazione" rows={4} data-testid="input-plan-features" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ordine visualizzazione</Label>
          <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} data-testid="input-sort-order" />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-is-active" />
          <Label>Piano attivo</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-plan">Annulla</Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || !priceCents} data-testid="button-save-plan">
          {plan ? "Aggiorna" : "Crea Piano"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminLicensePlans() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: plans, isLoading } = useQuery<LicensePlan[]>({
    queryKey: ["/api/admin/license-plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/license-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      setIsCreateOpen(false);
      toast({ title: "Piano creato con successo" });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/license-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      setEditingPlan(null);
      toast({ title: "Piano aggiornato" });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/license-plans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      toast({ title: "Piano eliminato" });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Piani Licenza</h1>
          <p className="text-sm text-muted-foreground">Gestisci i piani di abbonamento per i rivenditori</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-plan"><Plus className="w-4 h-4 mr-2" /> Nuovo Piano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Piano</DialogTitle>
            </DialogHeader>
            <PlanForm
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!plans || plans.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nessun piano creato</p>
            <p className="text-sm mt-1">Crea il primo piano licenza per i tuoi rivenditori</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""} data-testid={`card-plan-${plan.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {TARGET_LABELS[plan.targetCategory] || plan.targetCategory}
                    </Badge>
                    {!plan.isActive && <Badge variant="secondary" className="text-xs">Disattivo</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Modifica Piano</DialogTitle>
                      </DialogHeader>
                      {editingPlan && (
                        <PlanForm
                          plan={editingPlan}
                          onSave={(data) => updateMutation.mutate({ id: editingPlan.id, data })}
                          onCancel={() => setEditingPlan(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm("Sei sicuro di voler eliminare questo piano?")) {
                      deleteMutation.mutate(plan.id);
                    }
                  }} data-testid={`button-delete-plan-${plan.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-3xl font-bold">{(plan.priceCents / 100).toFixed(2)} EUR</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {DURATION_LABELS[plan.durationMonths] || `${plan.durationMonths} Mesi`}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                {plan.maxStaffUsers && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    Max {plan.maxStaffUsers} utenti staff
                  </div>
                )}
                {plan.features && (
                  <div className="text-sm space-y-1 pt-2 border-t">
                    {plan.features.split("\n").filter(Boolean).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 shrink-0">&#10003;</span>
                        <span>{f.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
