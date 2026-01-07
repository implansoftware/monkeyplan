import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, Package, Plus, Search, Clock, CheckCircle, XCircle, 
  Truck, Ban, Eye, Trash2, PackageCheck, ArrowRight, ArrowLeft,
  Smartphone, Wrench, ShoppingBag, Warehouse
} from "lucide-react";
import type { Product } from "@shared/schema";

type ProductWithStock = {
  product: Product;
  productType: string;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    ownerType: string;
    ownerId: string;
    ownerName: string;
    quantity: number;
  }>;
};

type TransferRequestItem = {
  id: string;
  productId: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
  shippedQuantity: number | null;
  receivedQuantity: number | null;
  product: Product | null;
};

type TransferRequest = {
  id: string;
  requestNumber: string;
  requesterType: string;
  requesterId: string;
  requesterWarehouseId: string;
  sourceWarehouseId: string;
  targetResellerId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'cancelled';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  shippedAt: string | null;
  shippedBy: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferRequestItem[];
  sourceWarehouse?: { id: string; name: string } | null;
  requesterWarehouse?: { id: string; name: string } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "In Attesa", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  approved: { label: "Approvata", color: "bg-blue-500/20 text-blue-700", icon: CheckCircle },
  rejected: { label: "Rifiutata", color: "bg-red-500/20 text-red-700", icon: XCircle },
  shipped: { label: "Spedita", color: "bg-purple-500/20 text-purple-700", icon: Truck },
  received: { label: "Ricevuta", color: "bg-green-500/20 text-green-700", icon: PackageCheck },
  cancelled: { label: "Annullata", color: "bg-gray-500/20 text-gray-700", icon: Ban },
};

export default function SubResellerTransferRequestsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [requestNotes, setRequestNotes] = useState("");
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; receivedQuantity: number }>>([]);

  const [wizardStep, setWizardStep] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [requestQuantity, setRequestQuantity] = useState(1);

  const { data: requests = [], isLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/reseller/sub-reseller/transfer-requests"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (productSearch.trim()) params.set("query", productSearch.trim());
    if (productTypeFilter !== "all") params.set("productType", productTypeFilter);
    return params.toString();
  }, [productSearch, productTypeFilter]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/reseller/sub-reseller/transfer-requests/search-products", searchParams],
    queryFn: async () => {
      const url = searchParams 
        ? `/api/reseller/sub-reseller/transfer-requests/search-products?${searchParams}`
        : "/api/reseller/sub-reseller/transfer-requests/search-products";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showNewRequestDialog && wizardStep === 1,
  });

  const resetWizard = () => {
    setWizardStep(1);
    setProductSearch("");
    setProductTypeFilter("all");
    setSelectedProduct(null);
    setSelectedWarehouse("");
    setRequestQuantity(1);
    setRequestNotes("");
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data: { notes: string; sourceWarehouseId: string; items: Array<{ productId: string; quantity: number }> }) => {
      return apiRequest("POST", "/api/reseller/sub-reseller/transfer-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      toast({ title: "Richiesta Inviata", description: "La richiesta di interscambio è stata inviata al reseller padre" });
      setShowNewRequestDialog(false);
      resetWizard();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/reseller/sub-reseller/transfer-requests/${requestId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      toast({ title: "Richiesta Annullata", description: "La richiesta è stata annullata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const receiveRequestMutation = useMutation({
    mutationFn: async (data: { requestId: string; items: Array<{ id: string; receivedQuantity: number }> }) => {
      return apiRequest("PATCH", `/api/reseller/sub-reseller/transfer-requests/${data.requestId}/receive`, { items: data.items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: "Ricezione Confermata", description: "Gli articoli sono stati aggiunti al tuo magazzino" });
      setShowReceiveDialog(false);
      setSelectedRequest(null);
      setReceiveItems([]);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleViewDetails = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleOpenReceive = (request: TransferRequest) => {
    setSelectedRequest(request);
    setReceiveItems(request.items.map(item => ({
      id: item.id,
      receivedQuantity: item.shippedQuantity || 0
    })));
    setShowReceiveDialog(true);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.items.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-title">Interscambio</h1>
              <p className="text-sm text-muted-foreground">Richiedi prodotti dal magazzino del reseller padre</p>
            </div>
          </div>
          <Button className="shadow-lg shadow-primary/25" onClick={() => setShowNewRequestDialog(true)} data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Richiesta
          </Button>
        </div>
      </div>

      <Dialog open={showNewRequestDialog} onOpenChange={(open) => {
        setShowNewRequestDialog(open);
        if (!open) resetWizard();
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta Interscambio</DialogTitle>
              <DialogDescription>
                {wizardStep === 1 && "Cerca il prodotto che vuoi richiedere"}
                {wizardStep === 2 && "Seleziona il magazzino da cui richiedere"}
                {wizardStep === 3 && "Conferma quantità e invia richiesta"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    wizardStep === step 
                      ? "bg-primary text-primary-foreground" 
                      : wizardStep > step 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {wizardStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && <div className={`w-12 h-1 ${wizardStep > step ? "bg-green-500" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca prodotto per nome, SKU o marca..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                        data-testid="input-product-search"
                      />
                    </div>
                    <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                      <SelectTrigger className="w-[160px]" data-testid="select-product-type">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i tipi</SelectItem>
                        <SelectItem value="ricambio">Ricambi</SelectItem>
                        <SelectItem value="accessorio">Accessori</SelectItem>
                        <SelectItem value="dispositivo">Dispositivi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isSearching && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {!isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nessun prodotto disponibile trovato</p>
                      <p className="text-sm">Prova a modificare i criteri di ricerca</p>
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="grid gap-2 max-h-[40vh] overflow-y-auto p-1 -m-1">
                      {searchResults.map((item) => {
                        const typeIcon = item.productType === 'dispositivo' ? Smartphone 
                          : item.productType === 'accessorio' ? ShoppingBag : Wrench;
                        const TypeIcon = typeIcon;
                        const totalStock = item.warehouses.reduce((sum, w) => sum + w.quantity, 0);
                        
                        return (
                          <Card 
                            key={item.product.id} 
                            className={`cursor-pointer transition-colors hover-elevate ${
                              selectedProduct?.product.id === item.product.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => {
                              setSelectedProduct(item);
                              setSelectedWarehouse("");
                              if (item.warehouses.length === 1) {
                                setSelectedWarehouse(item.warehouses[0].warehouseId);
                              }
                            }}
                            data-testid={`card-product-${item.product.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                  {item.product.imageUrl ? (
                                    <img 
                                      src={item.product.imageUrl} 
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.product.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{item.product.sku}</span>
                                    {item.product.brand && <span>| {item.product.brand}</span>}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary">
                                    {totalStock} disponibili
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.warehouses.length} magazzin{item.warehouses.length === 1 ? 'o' : 'i'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 2 && selectedProduct && (
                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {selectedProduct.product.imageUrl ? (
                            <img 
                              src={selectedProduct.product.imageUrl} 
                              alt={selectedProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{selectedProduct.product.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedProduct.product.sku}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Label>Seleziona il magazzino sorgente</Label>
                  <div className="grid gap-2">
                    {selectedProduct.warehouses.map((wh) => (
                      <Card
                        key={wh.warehouseId}
                        className={`cursor-pointer transition-colors hover-elevate ${
                          selectedWarehouse === wh.warehouseId ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedWarehouse(wh.warehouseId)}
                        data-testid={`card-warehouse-${wh.warehouseId}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Warehouse className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{wh.warehouseName}</p>
                                <p className="text-sm text-muted-foreground">{wh.ownerName}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-lg px-3">
                              {wh.quantity}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && selectedProduct && selectedWarehouse && (
                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {selectedProduct.product.imageUrl ? (
                            <img 
                              src={selectedProduct.product.imageUrl} 
                              alt={selectedProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{selectedProduct.product.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedProduct.product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Warehouse className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.warehouseName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Disponibili: {selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.quantity}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label>Quantità richiesta</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.quantity || 1}
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                      data-testid="input-request-quantity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Note (opzionale)</Label>
                    <Textarea
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Note aggiuntive per la richiesta..."
                      data-testid="input-request-notes"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {wizardStep > 1 && (
                <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)} data-testid="button-wizard-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Indietro
                </Button>
              )}
              {wizardStep === 1 && (
                <Button variant="outline" onClick={() => {
                  setShowNewRequestDialog(false);
                  resetWizard();
                }}>
                  Annulla
                </Button>
              )}
              {wizardStep === 1 && (
                <Button
                  onClick={() => setWizardStep(2)}
                  disabled={!selectedProduct}
                  data-testid="button-wizard-next-1"
                >
                  Avanti
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {wizardStep === 2 && (
                <Button
                  onClick={() => setWizardStep(3)}
                  disabled={!selectedWarehouse}
                  data-testid="button-wizard-next-2"
                >
                  Avanti
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {wizardStep === 3 && (
                <Button
                  onClick={() => createRequestMutation.mutate({
                    notes: requestNotes,
                    sourceWarehouseId: selectedWarehouse,
                    items: [{ productId: selectedProduct!.product.id, quantity: requestQuantity }]
                  })}
                  disabled={createRequestMutation.isPending || requestQuantity < 1 || !selectedWarehouse || !selectedProduct}
                  data-testid="button-submit-request"
                >
                  {createRequestMutation.isPending ? "Invio..." : "Invia Richiesta"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero richiesta o prodotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna richiesta trovata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status]?.icon || Clock;
            return (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <Badge className={statusConfig[request.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelRequestMutation.mutate(request.id)}
                          disabled={cancelRequestMutation.isPending}
                          data-testid={`button-cancel-${request.id}`}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Annulla
                        </Button>
                      )}
                      {request.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReceive(request)}
                          data-testid={`button-receive-${request.id}`}
                        >
                          <PackageCheck className="h-4 w-4 mr-1" />
                          Conferma Ricezione
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(request)}
                        data-testid={`button-details-${request.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data:</span>{" "}
                      {new Date(request.createdAt).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Articoli:</span>{" "}
                      {request.items.length} prodotti
                    </div>
                    <div>
                      <span className="text-muted-foreground">Da:</span>{" "}
                      {request.sourceWarehouse?.name || "Magazzino Reseller Padre"}
                    </div>
                  </div>
                  {request.rejectionReason && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                      Motivo rifiuto: {request.rejectionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stato:</span>{" "}
                  <Badge className={statusConfig[selectedRequest.status]?.color}>
                    {statusConfig[selectedRequest.status]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Data creazione:</span>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleDateString('it-IT')}
                </div>
                <div>
                  <span className="text-muted-foreground">Magazzino sorgente:</span>{" "}
                  {selectedRequest.sourceWarehouse?.name || "N/A"}
                </div>
                {selectedRequest.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Note:</span>{" "}
                    {selectedRequest.notes}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Articoli</h4>
                <div className="space-y-2">
                  {selectedRequest.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>{item.product?.name || "Prodotto"}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Richiesti: {item.requestedQuantity}</span>
                        {item.approvedQuantity !== null && <span>Approvati: {item.approvedQuantity}</span>}
                        {item.shippedQuantity !== null && <span>Spediti: {item.shippedQuantity}</span>}
                        {item.receivedQuantity !== null && <span>Ricevuti: {item.receivedQuantity}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conferma Ricezione</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Conferma la quantità ricevuta per ogni articolo:
              </p>
              {selectedRequest.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Spediti: {item.shippedQuantity}
                    </p>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={0}
                      max={item.shippedQuantity || 0}
                      value={receiveItems[index]?.receivedQuantity || 0}
                      onChange={(e) => {
                        const newItems = [...receiveItems];
                        newItems[index] = { ...newItems[index], receivedQuantity: parseInt(e.target.value) || 0 };
                        setReceiveItems(newItems);
                      }}
                      data-testid={`input-receive-quantity-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => selectedRequest && receiveRequestMutation.mutate({
                requestId: selectedRequest.id,
                items: receiveItems
              })}
              disabled={receiveRequestMutation.isPending}
              data-testid="button-confirm-receive"
            >
              {receiveRequestMutation.isPending ? "Conferma..." : "Conferma Ricezione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
