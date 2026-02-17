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
import { Smartphone, Plus, Search, Edit, Trash2, Tag, Globe, User, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { DeviceType } from "@shared/schema";
import { useTranslation } from "react-i18next";

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
  marketCodes?: string[];
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
  marketCodes?: string[];
}

const brandFormSchema = z.object({
  name: z.string().min(1, t("catalog.brandNameRequired")),
  logoUrl: z.string().optional(),
});

const modelFormSchema = z.object({
  modelName: z.string().min(1, t("catalog.modelNameRequired")),
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  typeId: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;
type ModelFormValues = z.infer<typeof modelFormSchema>;

export default function DeviceCatalog() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("brands");
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [deleteBrandDialogOpen, setDeleteBrandDialogOpen] = useState(false);
  const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<CustomBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CustomModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [modelMarketCodes, setModelMarketCodes] = useState<string[]>([]);
  const [newMarketCode, setNewMarketCode] = useState("");

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
      if (!res.ok) throw new Error("t("catalog.brandLoadError")");
      return res.json();
    },
  });

  const { data: models = [], isLoading: modelsLoading } = useQuery<CustomModel[]>({
    queryKey: ["/api/reseller/device-models", { includeGlobal: true }],
    queryFn: async () => {
      const res = await fetch("/api/reseller/device-models?includeGlobal=true");
      if (!res.ok) throw new Error("t("catalog.modelLoadError")");
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
        title: t("products.brandCreated"),
        description: t("catalog.brandAdded"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.brandCreateError"),
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
        title: t("catalog.brandUpdated"),
        description: t("common.changesSavedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.brandUpdateError"),
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
        title: t("catalog.brandDeleted"),
        description: t("catalog.brandRemoved"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.brandDeleteError"),
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
        title: t("products.modelCreated"),
        description: t("catalog.modelAdded"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.modelCreateError"),
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
        title: t("products.modelUpdated"),
        description: t("common.changesSavedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.modelUpdateError"),
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
        title: t("products.modelDeleted"),
        description: t("catalog.modelRemoved"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("catalog.modelDeleteError"),
        variant: "destructive",
      });
    },
  });

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.brandName && model.brandName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesOrigin = originFilter === "all" ||
      (originFilter === "global" && model.isGlobal) ||
      (originFilter === "custom" && !model.isGlobal);
    return matchesSearch && matchesOrigin;
  });

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
    setModelMarketCodes([]);
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
    setModelMarketCodes(model.marketCodes || []);
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
      updateModelMutation.mutate({ id: selectedModel.id, data: { ...data, marketCodes: modelMarketCodes } });
    } else {
      createModelMutation.mutate({ ...data, marketCodes: modelMarketCodes });
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">{t("products.deviceCatalog")}</h1>
              <p className="text-sm text-white/80">
                Gestisci brand e modelli personalizzati per la tua azienda
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md">
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
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{t("catalog.deviceBrands")}</CardTitle>
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
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="{t("catalog.searchBrand")}"
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
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                              <User className="h-3 w-3" />{t("suppliers.custom")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={brand.isActive ? "default" : "secondary"}>
                            {brand.isActive ? t("common.active") : t("common.inactive")}
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
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Modelli Dispositivi</CardTitle>
                <CardDescription>
                  I modelli globali sono gestiti dall'amministratore. Puoi aggiungere modelli personalizzati.
                </CardDescription>
              </div>
              <Button onClick={openCreateModelDialog} data-testid="button-add-model">
                <Plus className="h-4 w-4 mr-2" />{t("products.newModel")}</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="{t("catalog.searchModel")}"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-models"
                  />
                </div>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-origin-filter">
                    <SelectValue placeholder={t("shipping.origin")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("repairs.allOrigins")}</SelectItem>
                    <SelectItem value="global">Globale</SelectItem>
                    <SelectItem value="custom">{t("suppliers.custom")}</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>{t("products.marketCode")}</TableHead>
                      <TableHead>{t("products.modelName")}</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>{t("repairs.deviceType")}</TableHead>
                      <TableHead>{t("shipping.origin")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                        <TableCell>
                          {model.marketCodes && model.marketCodes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {model.marketCodes.slice(0, 2).map((code, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{code}</Badge>
                              ))}
                              {model.marketCodes.length > 2 && (
                                <Badge variant="secondary" className="text-xs">+{model.marketCodes.length - 2}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                              <User className="h-3 w-3" />{t("suppliers.custom")}</Badge>
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
            <DialogTitle>{isEditing ? t("catalog.editBrandTitle") : t("catalog.newBrandTitle")}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "{t("catalog.editBrandDesc")}"
                : "{t("catalog.addBrandDesc")}"}
            </DialogDescription>
          </DialogHeader>
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(handleBrandSubmit)} className="space-y-4">
              <FormField
                control={brandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("catalog.brandNameRequired")}</FormLabel>
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
                >{t("common.cancel")}</Button>
                <Button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  data-testid="button-save-brand"
                >
                  {createBrandMutation.isPending || updateBrandMutation.isPending
                    ? t("profile.saving")
                    : isEditing
                    ? t("profile.saveChanges")
                    : "{t("catalog.createBrand")}"}
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
            <DialogTitle>{isEditing ? t("products.editModel") : t("products.newModel")}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "{t("catalog.editModelDesc")}"
                : "{t("catalog.addModelDesc")}"}
            </DialogDescription>
          </DialogHeader>
          <Form {...modelForm}>
            <form onSubmit={modelForm.handleSubmit(handleModelSubmit)} className="space-y-4">
              <FormField
                control={modelForm.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("catalog.modelNameRequired")}</FormLabel>
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
                          <SelectValue placeholder="{t("catalog.selectBrand")}" />
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
                    <FormLabel>{t("repairs.deviceType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-model-type">
                          <SelectValue placeholder="{t("catalog.selectType")}" />
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

              {/* Market Codes */}
              {!isEditing || (selectedModel && !selectedModel.isGlobal) ? (
                <div className="space-y-2">
                  <Label>{t("products.marketCodes")}</Label>
                  <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md bg-muted/30">
                    {modelMarketCodes.map((code, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {code}
                        <button
                          type="button"
                          onClick={() => setModelMarketCodes(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="es. A2633"
                      value={newMarketCode}
                      onChange={(e) => setNewMarketCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const code = newMarketCode.trim();
                          if (code && !modelMarketCodes.includes(code)) {
                            setModelMarketCodes(prev => [...prev, code]);
                            setNewMarketCode("");
                          }
                        }
                      }}
                      data-testid="input-model-market-code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const code = newMarketCode.trim();
                        if (code && !modelMarketCodes.includes(code)) {
                          setModelMarketCodes(prev => [...prev, code]);
                          setNewMarketCode("");
                        }
                      }}
                      data-testid="button-add-market-code"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModelDialogOpen(false)}
                >{t("common.cancel")}</Button>
                <Button
                  type="submit"
                  disabled={createModelMutation.isPending || updateModelMutation.isPending}
                  data-testid="button-save-model"
                >
                  {createModelMutation.isPending || updateModelMutation.isPending
                    ? t("profile.saving")
                    : isEditing
                    ? t("profile.saveChanges")
                    : "{t("catalog.createModel")}"}
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
            <DialogTitle>{t("catalog.deleteBrand")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il brand "{selectedBrand?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBrandDialogOpen(false)}
            >{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => selectedBrand && deleteBrandMutation.mutate(selectedBrand.id)}
              disabled={deleteBrandMutation.isPending}
              data-testid="button-confirm-delete-brand"
            >
              {deleteBrandMutation.isPending ? t("pages.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Confirmation */}
      <Dialog open={deleteModelDialogOpen} onOpenChange={setDeleteModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteModel")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il modello "{selectedModel?.modelName}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModelDialogOpen(false)}
            >{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => selectedModel && deleteModelMutation.mutate(selectedModel.id)}
              disabled={deleteModelMutation.isPending}
              data-testid="button-confirm-delete-model"
            >
              {deleteModelMutation.isPending ? t("pages.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
