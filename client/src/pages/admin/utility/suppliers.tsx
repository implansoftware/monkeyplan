import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilitySupplier, InsertUtilitySupplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, Phone, Mail, Globe, Pencil, Trash2, 
  ArrowLeft, Building2, CheckCircle2, XCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const categoryLabels: Record<string, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

export default function AdminUtilitySuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<UtilitySupplier | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("fisso");
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilitySupplier) => {
      const res = await apiRequest("POST", "/api/utility/suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: "Fornitore utility creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilitySupplier> }) => {
      const res = await apiRequest("PATCH", `/api/utility/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: "Fornitore utility aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      toast({ title: "Fornitore utility eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertUtilitySupplier = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      category: selectedCategory as "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro",
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      portalUrl: formData.get("portalUrl") as string || undefined,
      referentName: formData.get("referentName") as string || undefined,
      referentPhone: formData.get("referentPhone") as string || undefined,
      referentEmail: formData.get("referentEmail") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      isActive: formData.get("isActive") === "on",
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: UtilitySupplier) => {
    setEditingSupplier(supplier);
    setSelectedCategory(supplier.category);
    setDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setSelectedCategory("fisso");
    setDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/utility">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Fornitori Utility</h1>
            <p className="text-muted-foreground">
              Gestisci provider di servizi telefonici ed energetici
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca fornitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
              data-testid="input-search-suppliers"
            />
          </div>
          <Button onClick={handleNewSupplier} data-testid="button-new-supplier">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Fornitore
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessun fornitore trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[supplier.category] || supplier.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {supplier.referentName && (
                          <span className="text-sm">{supplier.referentName}</span>
                        )}
                        {supplier.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Attivo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inattivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {supplier.portalUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={supplier.portalUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(supplier)}
                          data-testid={`button-edit-${supplier.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questo fornitore?")) {
                              deleteMutation.mutate(supplier.id);
                            }
                          }}
                          data-testid={`button-delete-${supplier.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Modifica Fornitore Utility" : "Nuovo Fornitore Utility"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? "Modifica i dati del fornitore di servizi utility."
                : "Aggiungi un nuovo fornitore di servizi telefonici o energetici."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSupplier?.name || ""}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Codice *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingSupplier?.code || ""}
                  placeholder="es. UTL-TIM"
                  required
                  data-testid="input-code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingSupplier?.email || ""}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingSupplier?.phone || ""}
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portalUrl">URL Portale Partner</Label>
              <Input
                id="portalUrl"
                name="portalUrl"
                type="url"
                defaultValue={editingSupplier?.portalUrl || ""}
                placeholder="https://"
                data-testid="input-portal-url"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referentName">Referente</Label>
                <Input
                  id="referentName"
                  name="referentName"
                  defaultValue={editingSupplier?.referentName || ""}
                  data-testid="input-referent-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referentPhone">Tel. Referente</Label>
                <Input
                  id="referentPhone"
                  name="referentPhone"
                  defaultValue={editingSupplier?.referentPhone || ""}
                  data-testid="input-referent-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referentEmail">Email Referente</Label>
                <Input
                  id="referentEmail"
                  name="referentEmail"
                  type="email"
                  defaultValue={editingSupplier?.referentEmail || ""}
                  data-testid="input-referent-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingSupplier?.notes || ""}
                data-testid="input-notes"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={editingSupplier?.isActive ?? true}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive">Fornitore attivo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingSupplier ? "Salva Modifiche" : "Crea Fornitore"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
