import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  FolderOpen, Plus, Pencil, Trash2, Loader2, GripVertical,
  Phone, Smartphone, Building2, Lightbulb, Flame, Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UtilityCategory } from "@shared/schema";

const ICON_OPTIONS = [
  { value: "Phone", label: "Telefono", icon: Phone },
  { value: "Smartphone", label: "Smartphone", icon: Smartphone },
  { value: "Building2", label: "Edificio", icon: Building2 },
  { value: "Lightbulb", label: "Lampadina", icon: Lightbulb },
  { value: "Flame", label: "Fiamma", icon: Flame },
  { value: "Zap", label: "Fulmine", icon: Zap },
];

const COLOR_OPTIONS = [
  { value: "#0088FE", label: "Blu" },
  { value: "#00C49F", label: "Verde Acqua" },
  { value: "#FFBB28", label: "Giallo" },
  { value: "#FF8042", label: "Arancione" },
  { value: "#8884d8", label: "Viola" },
  { value: "#82ca9d", label: "Verde" },
  { value: "#e74c3c", label: "Rosso" },
  { value: "#3498db", label: "Azzurro" },
];

function getIconComponent(iconName: string | null) {
  const option = ICON_OPTIONS.find(o => o.value === iconName);
  return option?.icon || Zap;
}

export default function AdminUtilityCategories() {
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UtilityCategory | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    icon: "Zap",
    color: "#0088FE",
    sortOrder: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<UtilityCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery<UtilityCategory[]>({
    queryKey: ["/api/utility/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/admin/utility/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Categoria creata", description: "La categoria è stata creata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UtilityCategory> }) => {
      return apiRequest("PATCH", `/api/admin/utility/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({ title: "Categoria aggiornata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/utility/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({ title: "Categoria eliminata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/utility/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      slug: "",
      name: "",
      description: "",
      icon: "Zap",
      color: "#0088FE",
      sortOrder: 0,
    });
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    resetForm();
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    setForm(prev => ({ ...prev, sortOrder: maxOrder + 1 }));
    setDialogOpen(true);
  };

  const openEditDialog = (category: UtilityCategory) => {
    setEditingCategory(category);
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "Zap",
      color: category.color || "#0088FE",
      sortOrder: category.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Errore", description: "Nome e slug sono obbligatori", variant: "destructive" });
      return;
    }
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (category: UtilityCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Catalogo Categorie Utility</h1>
            <p className="text-muted-foreground">Gestione categorie per servizi utility</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Catalogo Categorie Utility</h1>
            <p className="text-muted-foreground">Gestione categorie per servizi utility</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorie ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna categoria definita</p>
              <p className="text-sm">Crea la prima categoria per iniziare</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Ordine</TableHead>
                  <TableHead>Icona</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Colore</TableHead>
                  <TableHead>Attiva</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          {category.sortOrder}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color || "#0088FE" }}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-48 truncate">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: category.color || "#0088FE" }}
                          title={category.color || "Default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: category.id, isActive: checked })
                          }
                          data-testid={`switch-active-${category.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(category)}
                            data-testid={`button-edit-${category.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(category)}
                            data-testid={`button-delete-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifica Categoria" : "Nuova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="es. Telefonia Fissa"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="es. fisso"
                  disabled={!!editingCategory}
                  data-testid="input-slug"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrizione opzionale della categoria"
                rows={2}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icona</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((option) => {
                    const IconComp = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.icon === option.value ? "default" : "outline"}
                        size="icon"
                        onClick={() => setForm({ ...form, icon: option.value })}
                        title={option.label}
                        data-testid={`button-icon-${option.value}`}
                      >
                        <IconComp className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Colore</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.color === option.value ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: option.value }}
                      onClick={() => setForm({ ...form, color: option.value })}
                      title={option.label}
                      data-testid={`button-color-${option.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ordine di visualizzazione</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                min={0}
                data-testid="input-sort-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingCategory ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la categoria "{categoryToDelete?.name}"?
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
