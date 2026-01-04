import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Tag, Search, Smartphone, Loader2, AlertTriangle, CheckCircle, 
  Euro, Ticket, QrCode, Calendar, Clock, Store, RefreshCcw, XCircle,
  ChevronRight, Copy, ExternalLink
} from "lucide-react";

interface TrovausatiCredential {
  id: string;
  storesApiKey: string | null;
  storesIsActive: boolean;
}

interface TrovausatiShop {
  id: string;
  shopId: string;
  shopName: string | null;
  isActive: boolean;
}

interface DeviceModel {
  id: number;
  brand: string;
  model: string;
  label: string;
  type: string;
}

interface ModelValuation {
  type: "device";
  id: number;
  attributes: {
    brand: string;
    model: string;
    image: string;
    prices?: {
      never_used: number;
      great: number;
      good: number;
      average: number;
      shop: number;
      public: number;
    };
    anomalies?: Array<{
      description: string;
      percentage: number;
      price: number;
    }>;
    supervaluation?: {
      type: string;
      id: number;
      attributes: {
        price: number;
        description: string;
        expires_at: string;
        terms_url: string;
      };
    };
  };
}

interface Coupon {
  type: "coupon";
  id: string;
  attributes: {
    created_at: string;
    value: number;
    status: "issued" | "used" | "cancelled" | "expired";
    coupon_code: string;
    barcode?: string;
    brand: string;
    model: string;
    imei_or_sn: string;
    shop_id?: string;
    consumed_at?: string | null;
  };
}

const CONDITIONS = [
  { value: "never_used", label: "Mai usato", description: "Dispositivo nuovo, mai acceso" },
  { value: "great", label: "Ottimo", description: "Nessun segno visibile, funzionante al 100%" },
  { value: "good", label: "Buono", description: "Lievi segni d'uso, funzionante al 100%" },
  { value: "average", label: "Medio", description: "Segni d'uso evidenti ma funzionante" },
];

export default function TrovausatiValutatorePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("valutazione");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string>("good");
  const [imei, setImei] = useState("");
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [valuation, setValuation] = useState<ModelValuation | null>(null);
  const [showEmitCoupon, setShowEmitCoupon] = useState(false);
  const [couponPage, setCouponPage] = useState(0);
  const [couponStatusFilter, setCouponStatusFilter] = useState<string>("all");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const { data: credential, isLoading: loadingCredential } = useQuery<TrovausatiCredential | null>({
    queryKey: ["/api/trovausati/credentials"],
  });

  const { data: shops = [], isLoading: loadingShops } = useQuery<TrovausatiShop[]>({
    queryKey: ["/api/trovausati/shops"],
    enabled: !!credential?.storesIsActive,
  });

  // Load all models once, then filter client-side
  const { data: allModels = [], isLoading: loadingModels } = useQuery<DeviceModel[]>({
    queryKey: ["/api/trovausati/models"],
    enabled: !!credential?.storesIsActive,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Filter models based on search term
  const models = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return allModels.filter(m => 
      m.label?.toLowerCase().includes(term) ||
      m.brand?.toLowerCase().includes(term) ||
      m.model?.toLowerCase().includes(term)
    ).slice(0, 50); // Limit to 50 results
  }, [allModels, searchTerm]);

  const { data: couponsData, isLoading: loadingCoupons, refetch: refetchCoupons } = useQuery<{ coupons: Coupon[]; pagination?: any }>({
    queryKey: [`/api/trovausati/coupons?page=${couponPage}&status=${couponStatusFilter}`],
    enabled: !!credential?.storesIsActive && activeTab === "coupon",
  });

  const getValuationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedModel) throw new Error("Seleziona un modello");
      const res = await apiRequest("GET", `/api/trovausati/models/${selectedModel.id}/valuation`);
      return res.json();
    },
    onSuccess: (data) => {
      setValuation(data);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const emitCouponMutation = useMutation({
    mutationFn: async () => {
      if (!selectedModel || !imei || !selectedShopId) {
        throw new Error("Compila tutti i campi obbligatori");
      }
      const price = valuation?.attributes.prices?.[selectedCondition as keyof typeof valuation.attributes.prices] || 0;
      const res = await apiRequest("POST", "/api/trovausati/coupons", {
        modelId: selectedModel.id,
        condition: selectedCondition,
        imeiOrSn: imei,
        shopId: selectedShopId,
        value: price,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/coupons"] });
      setShowEmitCoupon(false);
      setSelectedCoupon(data);
      toast({ 
        title: "Coupon emesso", 
        description: `Codice: ${data.attributes?.coupon_code || data.coupon_code || "N/A"}` 
      });
      setActiveTab("coupon");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const consumeCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!selectedShopId) throw new Error("Seleziona un negozio");
      const res = await apiRequest("PATCH", `/api/trovausati/coupons/${code}/consume`, {
        shopId: selectedShopId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/coupons"] });
      setSelectedCoupon(null);
      toast({ title: "Coupon consumato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!selectedShopId) throw new Error("Seleziona un negozio");
      const res = await apiRequest("PATCH", `/api/trovausati/coupons/${code}/cancel`, {
        shopId: selectedShopId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/coupons"] });
      setSelectedCoupon(null);
      toast({ title: "Coupon annullato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "issued": { label: "Emesso", variant: "default" },
      "used": { label: "Utilizzato", variant: "secondary" },
      "cancelled": { label: "Annullato", variant: "destructive" },
      "expired": { label: "Scaduto", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPrice = (condition: string) => {
    if (!valuation?.attributes.prices) return 0;
    return valuation.attributes.prices[condition as keyof typeof valuation.attributes.prices] || 0;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiato", description: "Codice copiato negli appunti" });
  };

  if (loadingCredential) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!credential || !credential.storesIsActive) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Il Valutatore non è configurato o attivo. 
            <a href="/reseller/trovausati/settings" className="ml-1 underline">Configura le credenziali</a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Valutatore TrovaUsati</h1>
            <p className="text-muted-foreground">Valuta dispositivi e gestisci coupon GDS</p>
          </div>
        </div>
        {shops.length > 0 && (
          <Select value={selectedShopId} onValueChange={setSelectedShopId}>
            <SelectTrigger className="w-48" data-testid="select-shop">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleziona negozio" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.shopId}>
                  {shop.shopName || `Negozio ${shop.shopId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {shops.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nessun negozio configurato. 
            <a href="/reseller/trovausati/settings" className="ml-1 underline">Aggiungi un negozio</a>
            per poter emettere coupon.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="valutazione" className="flex items-center gap-2" data-testid="tab-valutazione">
            <Euro className="h-4 w-4" />
            Valutazione
          </TabsTrigger>
          <TabsTrigger value="coupon" className="flex items-center gap-2" data-testid="tab-coupon">
            <Ticket className="h-4 w-4" />
            Coupon GDS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valutazione" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Cerca Dispositivo
                </CardTitle>
                <CardDescription>Cerca il modello da valutare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cerca modello</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Es. iPhone 13 Pro, Samsung Galaxy S23..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-model"
                    />
                  </div>
                </div>

                {loadingModels && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}

                {models.length > 0 && (
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-1">
                      {models.map((model) => (
                        <Button
                          key={model.id}
                          variant={selectedModel?.id === model.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => {
                            setSelectedModel(model);
                            setValuation(null);
                          }}
                          data-testid={`model-item-${model.id}`}
                        >
                          <Smartphone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-medium">{model.label || `${model.brand} ${model.model}`}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {selectedModel && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{selectedModel.brand} {selectedModel.model}</p>
                        <p className="text-sm text-muted-foreground">{selectedModel.type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => getValuationMutation.mutate()}
                  disabled={!selectedModel || getValuationMutation.isPending}
                  data-testid="button-get-valuation"
                >
                  {getValuationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Euro className="h-4 w-4 mr-2" />
                  )}
                  Ottieni Valutazione
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Risultato Valutazione
                </CardTitle>
                <CardDescription>Prezzi in base alle condizioni</CardDescription>
              </CardHeader>
              <CardContent>
                {!valuation ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cerca un dispositivo e clicca su "Ottieni Valutazione"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {valuation.attributes.image && (
                      <div className="flex justify-center">
                        <img
                          src={valuation.attributes.image}
                          alt={`${valuation.attributes.brand} ${valuation.attributes.model}`}
                          className="h-32 object-contain"
                        />
                      </div>
                    )}

                    <RadioGroup value={selectedCondition} onValueChange={setSelectedCondition}>
                      {CONDITIONS.map((condition) => {
                        const price = getPrice(condition.value);
                        return (
                          <div
                            key={condition.value}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover-elevate ${
                              selectedCondition === condition.value ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedCondition(condition.value)}
                            data-testid={`condition-${condition.value}`}
                          >
                            <RadioGroupItem value={condition.value} id={condition.value} />
                            <div className="flex-1">
                              <Label htmlFor={condition.value} className="cursor-pointer">
                                {condition.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{condition.description}</p>
                            </div>
                            <span className="font-bold text-lg">
                              €{(price / 100).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </RadioGroup>

                    {valuation.attributes.supervaluation && (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <strong>Supervalutazione disponibile!</strong>
                          <br />
                          +€{(valuation.attributes.supervaluation.attributes.price / 100).toFixed(2)} - {valuation.attributes.supervaluation.attributes.description}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label>IMEI / Numero di Serie *</Label>
                      <Input
                        placeholder="Inserisci IMEI o S/N"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        data-testid="input-imei"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              {valuation && (
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => setShowEmitCoupon(true)}
                    disabled={!imei || !selectedShopId}
                    data-testid="button-emit-coupon"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Emetti Coupon - €{(getPrice(selectedCondition) / 100).toFixed(2)}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupon" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Coupon Emessi
                  </CardTitle>
                  <CardDescription>Gestisci i coupon GDS emessi</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={couponStatusFilter} onValueChange={setCouponStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="select-coupon-status">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="issued">Emessi</SelectItem>
                      <SelectItem value="used">Utilizzati</SelectItem>
                      <SelectItem value="cancelled">Annullati</SelectItem>
                      <SelectItem value="expired">Scaduti</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => refetchCoupons()} data-testid="button-refresh-coupons">
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCoupons ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !couponsData?.coupons?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun coupon trovato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {couponsData.coupons.map((coupon) => (
                    <Card 
                      key={coupon.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedCoupon(coupon)}
                      data-testid={`coupon-card-${coupon.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <QrCode className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">
                                  {coupon.attributes.coupon_code}
                                </span>
                                {getStatusBadge(coupon.attributes.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {coupon.attributes.brand} {coupon.attributes.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                IMEI: {coupon.attributes.imei_or_sn}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              €{(coupon.attributes.value / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(coupon.attributes.created_at).toLocaleDateString("it-IT")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEmitCoupon} onOpenChange={setShowEmitCoupon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Emissione Coupon</DialogTitle>
            <DialogDescription>
              Stai per emettere un coupon GDS per il ritiro del dispositivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedModel && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispositivo</span>
                  <span className="font-medium">{selectedModel.brand} {selectedModel.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condizione</span>
                  <span className="font-medium">
                    {CONDITIONS.find(c => c.value === selectedCondition)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IMEI/S.N.</span>
                  <span className="font-mono">{imei}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Valore Coupon</span>
                  <span className="font-bold text-primary">
                    €{(getPrice(selectedCondition) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Confermando, verrà generato un coupon GDS valido per la spesa presso i rivenditori convenzionati.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmitCoupon(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => emitCouponMutation.mutate()}
              disabled={emitCouponMutation.isPending}
              data-testid="button-confirm-emit-coupon"
            >
              {emitCouponMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ticket className="h-4 w-4 mr-2" />
              )}
              Emetti Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCoupon} onOpenChange={() => setSelectedCoupon(null)}>
        <DialogContent className="max-w-md">
          {selectedCoupon && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Dettaglio Coupon
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="p-4 bg-muted rounded-lg inline-block mb-2">
                      <QrCode className="h-16 w-16" />
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-mono text-2xl font-bold">
                        {selectedCoupon.attributes.coupon_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(selectedCoupon.attributes.coupon_code)}
                        data-testid="button-copy-coupon-code"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Stato</span>
                    {getStatusBadge(selectedCoupon.attributes.status)}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Valore</span>
                    <span className="font-bold">€{(selectedCoupon.attributes.value / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Dispositivo</span>
                    <span>{selectedCoupon.attributes.brand} {selectedCoupon.attributes.model}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">IMEI/S.N.</span>
                    <span className="font-mono text-sm">{selectedCoupon.attributes.imei_or_sn}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Data emissione</span>
                    <span>{new Date(selectedCoupon.attributes.created_at).toLocaleString("it-IT")}</span>
                  </div>
                  {selectedCoupon.attributes.consumed_at && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Data utilizzo</span>
                      <span>{new Date(selectedCoupon.attributes.consumed_at).toLocaleString("it-IT")}</span>
                    </div>
                  )}
                </div>

                {selectedCoupon.attributes.status === "issued" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => cancelCouponMutation.mutate(selectedCoupon.attributes.coupon_code)}
                      disabled={cancelCouponMutation.isPending || !selectedShopId}
                      data-testid="button-cancel-coupon"
                    >
                      {cancelCouponMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Annulla
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => consumeCouponMutation.mutate(selectedCoupon.attributes.coupon_code)}
                      disabled={consumeCouponMutation.isPending || !selectedShopId}
                      data-testid="button-consume-coupon"
                    >
                      {consumeCouponMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Utilizza
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
