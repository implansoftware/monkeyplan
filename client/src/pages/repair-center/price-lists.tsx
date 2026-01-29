import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ListOrdered, Plus, Pencil, Trash2, Star, StarOff, Eye, Search, Copy, Users, Euro
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PriceList } from "@shared/schema";

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function RepairCenterPriceLists() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySource, setCopySource] = useState<PriceList | null>(null);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [deleteList, setDeleteList] = useState<PriceList | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: priceLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const { data: inheritedLists, isLoading: inheritedLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists/inherited"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("/api/price-lists", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Listino creato", description: "Il listino prezzi è stato creato con successo" });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const copyMutation = useMutation({
    mutationFn: async ({ sourceId, name }: { sourceId: string; name: string }) => {
      return apiRequest(`/api/price-lists/copy/${sourceId}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Listino copiato", description: "Il listino è stato copiato con successo" });
      setShowCopyDialog(false);
      setCopySource(null);
      setFormData({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceList> }) => {
      return apiRequest(`/api/price-lists/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Listino aggiornato", description: "Le modifiche sono state salvate" });
      setEditingList(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/price-lists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Listino eliminato", description: "Il listino è stato eliminato" });
      setDeleteList(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/price-lists/${id}/set-default`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Listino predefinito", description: "Il listino è ora il predefinito" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredLists = priceLists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredInherited = inheritedLists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreateSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCopySubmit = () => {
    if (!copySource || !formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    copyMutation.mutate({ sourceId: copySource.id, name: formData.name });
  };

  const handleUpdateSubmit = () => {
    if (!editingList) return;
    updateMutation.mutate({
      id: editingList.id,
      data: { name: formData.name, description: formData.description },
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ListOrdered className="h-6 w-6 text-emerald-500" />
            Listini Prezzi
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i listini prezzi per il tuo centro riparazioni
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-list">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Listino
        </Button>
      </div>

      <Tabs defaultValue="mine" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
          <TabsTrigger value="mine" data-testid="tab-mine">I Miei Listini</TabsTrigger>
          <TabsTrigger value="inherited" data-testid="tab-inherited">
            <Users className="h-4 w-4 mr-2" />
            Dal Reseller
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-emerald-500" />
                    I Miei Listini
                  </CardTitle>
                  <CardDescription>
                    {filteredLists.length} listini creati
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredLists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun listino creato</p>
                  <p className="text-sm">Crea un listino o copia quello del reseller</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLists.map((list) => (
                      <TableRow key={list.id} data-testid={`row-pricelist-${list.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {list.name}
                            {list.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                Predefinito
                              </Badge>
                            )}
                            {list.parentListId && (
                              <Badge variant="outline" className="text-xs">Copiato</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {list.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={list.isActive ? "default" : "secondary"}>
                            {list.isActive ? "Attivo" : "Disattivato"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(list.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/repair-center/price-lists/${list.id}`}>
                              <Button size="icon" variant="ghost" data-testid={`button-view-${list.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setFormData({ name: list.name, description: list.description || "" });
                                setEditingList(list);
                              }}
                              data-testid={`button-edit-${list.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!list.isDefault && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDefaultMutation.mutate(list.id)}
                                disabled={setDefaultMutation.isPending}
                                data-testid={`button-default-${list.id}`}
                              >
                                <StarOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteList(list)}
                              data-testid={`button-delete-${list.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="inherited" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Listini del Reseller
                </CardTitle>
                <CardDescription>
                  Listini disponibili dal tuo reseller - puoi copiarli e personalizzarli
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {inheritedLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredInherited.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun listino disponibile dal reseller</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInherited.map((list) => (
                      <TableRow key={list.id} data-testid={`row-inherited-${list.id}`}>
                        <TableCell className="font-medium">{list.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {list.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCopySource(list);
                              setFormData({ name: `${list.name} (copia)`, description: "" });
                              setShowCopyDialog(true);
                            }}
                            data-testid={`button-copy-${list.id}`}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copia
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Listino Prezzi</DialogTitle>
            <DialogDescription>Crea un nuovo listino prezzi personalizzato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Listino *</Label>
              <Input
                id="name"
                placeholder="es. Listino Standard"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Descrizione opzionale..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annulla</Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending} data-testid="button-submit-create">
              {createMutation.isPending ? "Creazione..." : "Crea Listino"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopyDialog} onOpenChange={(open) => { setShowCopyDialog(open); if (!open) setCopySource(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copia Listino</DialogTitle>
            <DialogDescription>
              Copia il listino "{copySource?.name}" e personalizzalo per il tuo centro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="copy-name">Nome del Nuovo Listino *</Label>
              <Input
                id="copy-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-copy-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCopyDialog(false); setCopySource(null); }}>Annulla</Button>
            <Button onClick={handleCopySubmit} disabled={copyMutation.isPending} data-testid="button-submit-copy">
              <Copy className="h-4 w-4 mr-2" />
              {copyMutation.isPending ? "Copia in corso..." : "Copia Listino"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Listino</DialogTitle>
            <DialogDescription>Modifica le informazioni del listino</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-edit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingList(null)}>Annulla</Button>
            <Button onClick={handleUpdateSubmit} disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteList} onOpenChange={(open) => !open && setDeleteList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Eliminare il listino "{deleteList?.name}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteList && deleteMutation.mutate(deleteList.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
