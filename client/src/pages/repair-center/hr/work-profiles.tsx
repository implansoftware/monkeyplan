import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Briefcase, Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface WorkProfile {
  id: string;
  name: string;
  description?: string;
  weeklyHours: number;
  dailyHours: number;
  isDefault: boolean;
}

export default function RepairCenterHrWorkProfiles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<WorkProfile | null>(null);
  const [newProfile, setNewProfile] = useState({ name: "", description: "", weeklyHours: "40", dailyHours: "8" });
  const { toast } = useToast();

  const { data: workProfiles = [], isLoading } = useQuery<WorkProfile[]>({
    queryKey: ["/api/repair-center/hr/work-profiles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/repair-center/hr/work-profiles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/work-profiles"] });
      setDialogOpen(false);
      setNewProfile({ name: "", description: "", weeklyHours: "40", dailyHours: "8" });
      toast({ title: "Profilo creato", description: "Il profilo orario è stato creato con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/work-profiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/work-profiles"] });
      setDialogOpen(false);
      setEditingProfile(null);
      toast({ title: "Profilo aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/repair-center/hr/work-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/work-profiles"] });
      toast({ title: "Profilo eliminato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (profile: WorkProfile) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      description: profile.description || "",
      weeklyHours: profile.weeklyHours.toString(),
      dailyHours: profile.dailyHours.toString()
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: newProfile.name,
      description: newProfile.description || undefined,
      weeklyHours: parseFloat(newProfile.weeklyHours) || 40,
      dailyHours: parseFloat(newProfile.dailyHours) || 8
    };

    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6" data-testid="page-rc-hr-work-profiles">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Profili Lavoro</h1>
              <p className="text-emerald-100">Configurazione orari di lavoro</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
            <Button onClick={() => { setEditingProfile(null); setNewProfile({ name: "", description: "", weeklyHours: "40", dailyHours: "8" }); setDialogOpen(true); }} className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Profilo
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profili Configurati</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : workProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun profilo orario configurato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Ore/Sett.</TableHead>
                  <TableHead>Ore/Giorno</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{profile.description || "-"}</TableCell>
                    <TableCell>{profile.weeklyHours}h</TableCell>
                    <TableCell>{profile.dailyHours}h</TableCell>
                    <TableCell>
                      {profile.isDefault && <Badge variant="secondary">Default</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(profile)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(profile.id)} disabled={profile.isDefault}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Modifica Profilo" : "Nuovo Profilo Orario"}</DialogTitle>
            <DialogDescription>Configura le impostazioni del profilo orario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome Profilo</label>
              <Input value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="Es. Full-time" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ore Settimanali</label>
                <Input type="number" value={newProfile.weeklyHours} onChange={(e) => setNewProfile({ ...newProfile, weeklyHours: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Ore Giornaliere</label>
                <Input type="number" value={newProfile.dailyHours} onChange={(e) => setNewProfile({ ...newProfile, dailyHours: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Descrizione (opzionale)</label>
              <Textarea value={newProfile.description} onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })} placeholder="Descrizione del profilo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !newProfile.name}>
              {editingProfile ? "Salva Modifiche" : "Crea Profilo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
