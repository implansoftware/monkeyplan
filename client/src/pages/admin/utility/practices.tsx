import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilityPractice, InsertUtilityPractice, UtilitySupplier, UtilityService, User, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, FileCheck, Pencil, Trash2, 
  ArrowLeft, User as UserIcon, Eye, Package, Calendar, Euro
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";

const statusLabels: Record<PracticeStatus, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  attesa_documenti: "Attesa Documenti",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const statusColors: Record<PracticeStatus, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const categoryLabels: Record<string, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type ItemType = "service" | "product";
type PriceType = "mensile" | "forfait";

interface PracticeProductItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
}

export default function AdminUtilityPractices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<UtilityPractice | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<PracticeStatus>("bozza");
  const [selectedItemType, setSelectedItemType] = useState<ItemType>("service");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>("mensile");
  const [practiceProducts, setPracticeProducts] = useState<PracticeProductItem[]>([]);
  const { toast } = useToast();

  const { data: practices = [], isLoading } = useQuery<UtilityPractice[]>({
    queryKey: ["/api/utility/practices"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const { data: services = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services", selectedSupplierId],
    queryFn: async () => {
      const url = selectedSupplierId 
        ? `/api/utility/services?supplierId=${selectedSupplierId}`
        : "/api/utility/services";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedSupplierId,
  });
  
  const { data: allServices = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilityPractice) => {
      const res = await apiRequest("POST", "/api/utility/practices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilityPractice> }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      toast({ title: "Pratica eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<InsertUtilityPractice> = {
      itemType: selectedItemType,
      customerId: formData.get("customerId") as string,
      supplierReference: formData.get("supplierReference") as string || undefined,
      status: selectedStatus,
      priceType: selectedPriceType,
      monthlyPriceCents: selectedPriceType === "mensile" && formData.get("monthlyPriceCents") 
        ? Math.round(parseFloat(formData.get("monthlyPriceCents") as string) * 100) 
        : undefined,
      flatPriceCents: selectedPriceType === "forfait" && formData.get("flatPriceCents")
        ? Math.round(parseFloat(formData.get("flatPriceCents") as string) * 100)
        : undefined,
      commissionAmountCents: formData.get("commissionAmountCents")
        ? Math.round(parseFloat(formData.get("commissionAmountCents") as string) * 100)
        : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    if (selectedItemType === "service") {
      data.supplierId = selectedSupplierId;
      data.serviceId = selectedServiceId;
      data.productId = null;
    } else {
      data.productId = practiceProducts.length > 0 ? practiceProducts[0].productId : null;
      data.serviceId = null;
      data.supplierId = null;
    }

    // Include products array for product type practices
    const submitData = selectedItemType === "product" && practiceProducts.length > 0
      ? { ...data, products: practiceProducts }
      : data;

    if (editingPractice) {
      updateMutation.mutate({ id: editingPractice.id, data: submitData });
    } else {
      createMutation.mutate(submitData as InsertUtilityPractice);
    }
  };

  const handleEdit = async (practice: UtilityPractice) => {
    setEditingPractice(practice);
    setSelectedItemType((practice.itemType as ItemType) || "service");
    setSelectedSupplierId(practice.supplierId || "");
    setSelectedServiceId(practice.serviceId || "");
    setSelectedProductId(practice.productId || "");
    setSelectedStatus(practice.status);
    setSelectedPriceType((practice.priceType as PriceType) || "mensile");
    
    // Load existing practice products
    if (practice.itemType === "product") {
      try {
        const res = await fetch(`/api/utility/practices/${practice.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.practiceProducts && data.practiceProducts.length > 0) {
            setPracticeProducts(data.practiceProducts.map((pp: any) => ({
              productId: pp.productId,
              quantity: pp.quantity,
              unitPriceCents: pp.unitPriceCents,
              notes: pp.notes || "",
            })));
          } else if (practice.productId) {
            // Fallback to single product
            const product = products.find(p => p.id === practice.productId);
            setPracticeProducts([{
              productId: practice.productId,
              quantity: 1,
              unitPriceCents: product?.unitPrice || 0,
            }]);
          } else {
            setPracticeProducts([]);
          }
        }
      } catch {
        setPracticeProducts([]);
      }
    } else {
      setPracticeProducts([]);
    }
    
    setDialogOpen(true);
  };

  const handleNewPractice = () => {
    setEditingPractice(null);
    setSelectedItemType("service");
    setSelectedSupplierId("");
    setSelectedServiceId("");
    setSelectedProductId("");
    setSelectedStatus("bozza");
    setSelectedPriceType("mensile");
    setPracticeProducts([]);
    setDialogOpen(true);
  };

  const addProduct = () => {
    setPracticeProducts([...practiceProducts, { productId: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeProduct = (index: number) => {
    setPracticeProducts(practiceProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof PracticeProductItem, value: any) => {
    const updated = [...practiceProducts];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill price when selecting product
    if (field === "productId" && value) {
      const product = products.find(p => p.id === value);
      if (product && updated[index].unitPriceCents === 0) {
        updated[index].unitPriceCents = product.unitPrice || 0;
      }
    }
    
    setPracticeProducts(updated);
  };

  const calculateProductsTotal = () => {
    return practiceProducts.reduce((sum, p) => sum + (p.quantity * p.unitPriceCents), 0);
  };

  const filteredPractices = practices.filter((practice) => {
    const matchesSearch = practice.practiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (practice.supplierReference && practice.supplierReference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || practice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customerUsers = customers;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/utility">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pratiche Utility</h1>
            <p className="text-muted-foreground">
              Gestisci contratti e pratiche di servizi utility
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero pratica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-practices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewPractice} data-testid="button-new-practice">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Pratica
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessuna pratica trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Pratica</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Servizio/Prodotto</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractices.map((practice) => {
                  const supplier = suppliers.find(s => s.id === practice.supplierId);
                  const service = allServices.find(s => s.id === practice.serviceId);
                  const product = products.find(p => p.id === practice.productId);
                  const customer = customers.find(c => c.id === practice.customerId);
                  const itemType = practice.itemType || "service";
                  return (
                    <TableRow key={practice.id} data-testid={`row-practice-${practice.id}`}>
                      <TableCell className="font-medium">
                        {practice.practiceNumber}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            {customer.fullName}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {itemType === "service" ? "Servizio" : "Prodotto"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {itemType === "service" && service ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {categoryLabels[service.category]} {supplier ? `• ${supplier.name}` : ""}
                            </span>
                          </div>
                        ) : itemType === "product" ? (
                          <div className="flex flex-col">
                            {(practice as any).practiceProducts?.length > 0 ? (
                              <>
                                {(practice as any).practiceProducts.slice(0, 2).map((pp: any, idx: number) => {
                                  const prod = products.find(p => p.id === pp.productId);
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{prod?.name || "Prodotto"} x{pp.quantity}</span>
                                    </div>
                                  );
                                })}
                                {(practice as any).practiceProducts.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{(practice as any).practiceProducts.length - 2} altri prodotti
                                  </span>
                                )}
                              </>
                            ) : product ? (
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{product.name}</span>
                              </div>
                            ) : "-"}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {practice.priceType === "forfait" && practice.flatPriceCents
                          ? formatCurrency(practice.flatPriceCents)
                          : practice.monthlyPriceCents 
                            ? formatCurrency(practice.monthlyPriceCents) + "/mese"
                            : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[practice.status]}>
                          {statusLabels[practice.status] || practice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/utility/practices/${practice.id}`}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-view-${practice.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(practice)}
                            data-testid={`button-edit-${practice.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questa pratica?")) {
                                deleteMutation.mutate(practice.id);
                              }
                            }}
                            data-testid={`button-delete-${practice.id}`}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPractice ? "Modifica Pratica" : "Nuova Pratica Utility"}
            </DialogTitle>
            <DialogDescription>
              {editingPractice 
                ? "Modifica i dati della pratica."
                : "Crea una nuova pratica di servizio utility."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Pratica *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedItemType === "service" ? "default" : "outline"}
                  onClick={() => setSelectedItemType("service")}
                  className="flex-1"
                  data-testid="button-item-type-service"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Servizio Utility
                </Button>
                <Button
                  type="button"
                  variant={selectedItemType === "product" ? "default" : "outline"}
                  onClick={() => setSelectedItemType("product")}
                  className="flex-1"
                  data-testid="button-item-type-product"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Prodotto
                </Button>
              </div>
            </div>

            {selectedItemType === "service" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fornitore *</Label>
                  <Select 
                    name="supplierId" 
                    value={selectedSupplierId}
                    onValueChange={(val) => {
                      setSelectedSupplierId(val);
                      setSelectedServiceId("");
                    }}
                    required
                  >
                    <SelectTrigger data-testid="select-supplier">
                      <SelectValue placeholder="Seleziona fornitore" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(s => s.isActive).map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceId">Servizio *</Label>
                  <Select 
                    name="serviceId" 
                    value={selectedServiceId}
                    onValueChange={setSelectedServiceId}
                    disabled={!selectedSupplierId}
                    required
                  >
                    <SelectTrigger data-testid="select-service">
                      <SelectValue placeholder="Seleziona servizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.isActive).map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({categoryLabels[service.category]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Prodotti *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                    data-testid="button-add-product"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Prodotto
                  </Button>
                </div>
                
                {practiceProducts.length === 0 ? (
                  <div className="text-center py-4 border rounded-md border-dashed">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nessun prodotto aggiunto. Clicca "Aggiungi Prodotto" per iniziare.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceProducts.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Prodotto {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(index)}
                            data-testid={`button-remove-product-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-3">
                            <Label className="text-xs">Prodotto</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(val) => updateProduct(index, "productId", val)}
                            >
                              <SelectTrigger data-testid={`select-product-${index}`}>
                                <SelectValue placeholder="Seleziona prodotto" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.filter(p => p.isActive).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} {product.sku ? `(${product.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Quantità</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                              data-testid={`input-quantity-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prezzo Unit. (EUR)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={(item.unitPriceCents / 100).toFixed(2)}
                              onChange={(e) => updateProduct(index, "unitPriceCents", Math.round(parseFloat(e.target.value || "0") * 100))}
                              data-testid={`input-unit-price-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Totale</Label>
                            <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                              {formatCurrency(item.quantity * item.unitPriceCents)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {practiceProducts.length > 0 && (
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground mr-2">Totale Prodotti:</span>
                          <span className="font-bold">{formatCurrency(calculateProductsTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <Select 
                name="customerId" 
                defaultValue={editingPractice?.customerId}
                required
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customerUsers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierReference">Riferimento Fornitore</Label>
                <Input
                  id="supplierReference"
                  name="supplierReference"
                  defaultValue={editingPractice?.supplierReference || ""}
                  placeholder="Codice pratica fornitore"
                  data-testid="input-supplier-reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select 
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as PracticeStatus)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo Prezzo *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedPriceType === "mensile" ? "default" : "outline"}
                  onClick={() => setSelectedPriceType("mensile")}
                  className="flex-1"
                  data-testid="button-price-mensile"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Mensile
                </Button>
                <Button
                  type="button"
                  variant={selectedPriceType === "forfait" ? "default" : "outline"}
                  onClick={() => setSelectedPriceType("forfait")}
                  className="flex-1"
                  data-testid="button-price-forfait"
                >
                  <Euro className="h-4 w-4 mr-2" />
                  Forfait
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {selectedPriceType === "mensile" ? (
                  <>
                    <Label htmlFor="monthlyPriceCents">Prezzo Mensile (EUR)</Label>
                    <Input
                      id="monthlyPriceCents"
                      name="monthlyPriceCents"
                      type="number"
                      step="0.01"
                      defaultValue={editingPractice?.monthlyPriceCents 
                        ? (editingPractice.monthlyPriceCents / 100).toFixed(2) 
                        : ""}
                      data-testid="input-monthly-price"
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="flatPriceCents">Prezzo Forfait (EUR)</Label>
                    <Input
                      id="flatPriceCents"
                      name="flatPriceCents"
                      type="number"
                      step="0.01"
                      defaultValue={editingPractice?.flatPriceCents 
                        ? (editingPractice.flatPriceCents / 100).toFixed(2) 
                        : ""}
                      data-testid="input-flat-price"
                    />
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionAmountCents">Commissione (EUR)</Label>
                <Input
                  id="commissionAmountCents"
                  name="commissionAmountCents"
                  type="number"
                  step="0.01"
                  defaultValue={editingPractice?.commissionAmountCents 
                    ? (editingPractice.commissionAmountCents / 100).toFixed(2) 
                    : ""}
                  data-testid="input-commission"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingPractice?.notes || ""}
                data-testid="input-notes"
              />
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
                {editingPractice ? "Salva Modifiche" : "Crea Pratica"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
