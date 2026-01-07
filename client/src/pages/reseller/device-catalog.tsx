import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Plus, Search, Edit, Trash2, Tag, Globe, User } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { DeviceType } from "@shared/schema";

interface CustomBrand {
  id: string;
  resellerId: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isGlobal: boolean;
  isCustom: boolean;
}

interface CustomModel {
  id: string;
  resellerId?: string;
  modelName: string;
  brandId: string | null;
  resellerBrandId: string | null;
  brandName: string | null;
  typeId: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isGlobal: boolean;
  isCustom: boolean;
}

const brandFormSchema = z.object({
  name: z.string().min(1, "Nome brand obbligatorio"),
  logoUrl: z.string().optional(),
});

const modelFormSchema = z.object({
  modelName: z.string().min(1, "Nome modello obbligatorio"),
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  typeId: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;
type ModelFormValues = z.infer<typeof modelFormSchema>;

export default function DeviceCatalog() {
  const [activeTab, setActiveTab] = useState("brands");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [deleteBrandDialogOpen, setDeleteBrandDialogOpen] = useState(false);
  const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<CustomBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CustomModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
    },
  });

  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      modelName: "",
      brandId: "",
      brandName: "",
      typeId: "",
    },
  });

  const { data: brands = [], isLoading: brandsLoading } = useQuery<CustomBrand[]>({
    queryKey: ["/api/reseller/device-brands", { includeGlobal: true }],
    queryFn: async () => {
      const res = await fetch("/api/reseller/device-brands?includeGlobal=true");
      if (!res.ok) throw new Error("Errore caricamento brand");
      return res.json();
    },
  });

  const { data: models = [], isLoading: modelsLoading } = useQuery<CustomModel[]>({
    queryKey: ["/api/reseller/device-models", { includeGlobal: true }],
    queryFn: async () => {
      const res = await fetch("/api/reseller/device-models?includeGlobal=true");
      if (!res.ok) throw new Error("Errore caricamento modelli");
      return res.json();
    },
  });

  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: BrandFormValues) => {
      return apiRequest("POST", "/api/reseller/device-brands", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-brands"] });
      setBrandDialogOpen(false);
      brandForm.reset();
      toast({
        title: "Brand creato",
        description: "Il nuovo brand è stato aggiunto con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il brand",
        variant: "destructive",
      });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BrandFormValues> }) => {
      return apiRequest("PATCH", `/api/reseller/device-brands/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-brands"] });
      setBrandDialogOpen(false);
      setSelectedBrand(null);
      setIsEditing(false);
      brandForm.reset();
      toast({
        title: "Brand aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il brand",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/device-brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-brands"] });
      setDeleteBrandDialogOpen(false);
      setSelectedBrand(null);
      toast({
        title: "Brand eliminato",
        description: "Il brand è stato rimosso con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il brand",
        variant: "destructive",
      });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: ModelFormValues) => {
      return apiRequest("POST", "/api/reseller/device-models", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-models"] });
      setModelDialogOpen(false);
      modelForm.reset();
      toast({
        title: "Modello creato",
        description: "Il nuovo modello è stato aggiunto con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il modello",
        variant: "destructive",
      });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModelFormValues> }) => {
      return apiRequest("PATCH", `/api/reseller/device-models/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-models"] });
      setModelDialogOpen(false);
      setSelectedModel(null);
      setIsEditing(false);
      modelForm.reset();
      toast({
        title: "Modello aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il modello",
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/device-models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/device-models"] });
      setDeleteModelDialogOpen(false);
      setSelectedModel(null);
      toast({
        title: "Modello eliminato",
        description: "Il modello è stato rimosso con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il modello",
        variant: "destructive",
      });
    },
  });

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = models.filter((model) =>
    model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model.brandName && model.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openCreateBrandDialog = () => {
    setIsEditing(false);
    setSelectedBrand(null);
    brandForm.reset({ name: "", logoUrl: "" });
    setBrandDialogOpen(true);
  };

  const openEditBrandDialog = (brand: CustomBrand) => {
    if (brand.isGlobal) return;
    setIsEditing(true);
    setSelectedBrand(brand);
    brandForm.reset({
      name: brand.name,
      logoUrl: brand.logoUrl || "",
    });
    setBrandDialogOpen(true);
  };

  const openCreateModelDialog = () => {
    setIsEditing(false);
    setSelectedModel(null);
    modelForm.reset({ modelName: "", brandId: "", brandName: "", typeId: "" });
    setModelDialogOpen(true);
  };

  const openEditModelDialog = (model: CustomModel) => {
    if (model.isGlobal) return;
    setIsEditing(true);
    setSelectedModel(model);
    modelForm.reset({
      modelName: model.modelName,
      brandId: model.brandId || model.resellerBrandId || "",
      brandName: model.brandName || "",
      typeId: model.typeId || "",
    });
    setModelDialogOpen(true);
  };

  const handleBrandSubmit = (data: BrandFormValues) => {
    if (isEditing && selectedBrand) {
      updateBrandMutation.mutate({ id: selectedBrand.id, data });
    } else {
      createBrandMutation.mutate(data);
    }
  };

  const handleModelSubmit = (data: ModelFormValues) => {
    if (isEditing && selectedModel) {
      updateModelMutation.mutate({ id: selectedModel.id, data });
    } else {
      createModelMutation.mutate(data);
    }
  };

  const getBrandName = (model: CustomModel): string => {
    if (model.brandName) return model.brandName;
    if (model.brandId) {
      const brand = brands.find(b => b.id === model.brandId);
      return brand?.name || "-";
    }
    if (model.resellerBrandId) {
      const brand = brands.find(b => b.id === model.resellerBrandId);
      return brand?.name || "-";
    }
    return "-";
  };

  const getTypeName = (typeId: string | null): string => {
    if (!typeId) return "-";
    const type = deviceTypes.find(t => t.id === typeId);
    return type?.name || "-";
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Catalogo Dispositivi
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestisci brand e modelli personalizzati per la tua azienda
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="brands" data-testid="tab-brands">
            <Tag className="h-4 w-4 mr-2" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="models" data-testid="tab-models">
            <Smartphone className="h-4 w-4 mr-2" />
            Modelli
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Brand Dispositivi</CardTitle>
                <CardDescription>
                  I brand globali sono gestiti dall'amministratore. Puoi aggiungere brand personalizzati.
                </CardDescription>
              </div>
              <Button onClick={openCreateBrandDialog} data-testid="button-add-brand">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Brand
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-brands"
                  />
                </div>
              </div>

              {brandsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun brand trovato
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id} data-testid={`row-brand-${brand.id}`}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>
                          {brand.isGlobal ? (
                            <Badge variant="secondary" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Globale
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <User className="h-3 w-3" />
                              Personalizzato
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={brand.isActive ? "default" : "secondary"}>
                            {brand.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {brand.isCustom && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditBrandDialog(brand)}
                                data-testid={`button-edit-brand-${brand.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedBrand(brand);
                                  setDeleteBrandDialogOpen(true);
                                }}
                                data-testid={`button-delete-brand-${brand.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Modelli Dispositivi</CardTitle>
                <CardDescription>
                  I modelli globali sono gestiti dall'amministratore. Puoi aggiungere modelli personalizzati.
                </CardDescription>
              </div>
              <Button onClick={openCreateModelDialog} data-testid="button-add-model">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Modello
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca modello..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-models"
                  />
                </div>
              </div>

              {modelsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun modello trovato
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Modello</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Tipo Dispositivo</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                        <TableCell className="font-medium">{model.modelName}</TableCell>
                        <TableCell>{getBrandName(model)}</TableCell>
                        <TableCell>{getTypeName(model.typeId)}</TableCell>
                        <TableCell>
                          {model.isGlobal ? (
                            <Badge variant="secondary" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Globale
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <User className="h-3 w-3" />
                              Personalizzato
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {model.isCustom && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModelDialog(model)}
                                data-testid={`button-edit-model-${model.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedModel(model);
                                  setDeleteModelDialogOpen(true);
                                }}
                                data-testid={`button-delete-model-${model.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
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

      {/* Brand Dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifica Brand" : "Nuovo Brand"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica i dettagli del brand personalizzato"
                : "Aggiungi un nuovo brand personalizzato al tuo catalogo"}
            </DialogDescription>
          </DialogHeader>
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(handleBrandSubmit)} className="space-y-4">
              <FormField
                control={brandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Brand *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="es. OnePlus, Nothing, etc."
                        data-testid="input-brand-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Logo (opzionale)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://..."
                        data-testid="input-brand-logo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBrandDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  data-testid="button-save-brand"
                >
                  {createBrandMutation.isPending || updateBrandMutation.isPending
                    ? "Salvataggio..."
                    : isEditing
                    ? "Salva Modifiche"
                    : "Crea Brand"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifica Modello" : "Nuovo Modello"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica i dettagli del modello personalizzato"
                : "Aggiungi un nuovo modello personalizzato al tuo catalogo"}
            </DialogDescription>
          </DialogHeader>
          <Form {...modelForm}>
            <form onSubmit={modelForm.handleSubmit(handleModelSubmit)} className="space-y-4">
              <FormField
                control={modelForm.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Modello *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="es. iPhone 15 Pro Max"
                        data-testid="input-model-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={modelForm.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-model-brand">
                          <SelectValue placeholder="Seleziona brand..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name} {brand.isGlobal ? "(Globale)" : "(Custom)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={modelForm.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Dispositivo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-model-type">
                          <SelectValue placeholder="Seleziona tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModelDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createModelMutation.isPending || updateModelMutation.isPending}
                  data-testid="button-save-model"
                >
                  {createModelMutation.isPending || updateModelMutation.isPending
                    ? "Salvataggio..."
                    : isEditing
                    ? "Salva Modifiche"
                    : "Crea Modello"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Confirmation */}
      <Dialog open={deleteBrandDialogOpen} onOpenChange={setDeleteBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Brand</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il brand "{selectedBrand?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBrandDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBrand && deleteBrandMutation.mutate(selectedBrand.id)}
              disabled={deleteBrandMutation.isPending}
              data-testid="button-confirm-delete-brand"
            >
              {deleteBrandMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Confirmation */}
      <Dialog open={deleteModelDialogOpen} onOpenChange={setDeleteModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Modello</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il modello "{selectedModel?.modelName}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModelDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedModel && deleteModelMutation.mutate(selectedModel.id)}
              disabled={deleteModelMutation.isPending}
              data-testid="button-confirm-delete-model"
            >
              {deleteModelMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
