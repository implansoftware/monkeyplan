import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Package, ShoppingCart, Search, ChevronRight, Plus, Minus, 
  Check, AlertTriangle, Loader2, Settings, ArrowLeft, Image
} from "lucide-react";

interface SifarStore {
  id: string;
  storeCode: string;
  storeName: string | null;
  isDefault: boolean;
}

interface SifarBrand {
  codiceMarca: string;
  descMarca: string;
}

interface SifarModel {
  codiceModello: string;
  descModello: string;
  codiceMarca: string;
}

interface SifarArticle {
  codiceArticolo: string;
  descArticolo: string;
  prezzo: number;
  prezzoIvato: number;
  aliquota: number;
  disponibile: boolean;
  giacenza?: number;
  ean?: string;
  contattaPerOrdinare?: boolean;
  urlImmagine?: string;
  qualita?: string;
  mesiGaranzia?: number;
}

interface SifarCartDetail {
  articoli: Array<{
    codiceArticolo: string;
    descArticolo: string;
    quantita: number;
    prezzo: number;
    prezzoIvato: number;
    totale: number;
    totaleIvato: number;
    disponibile: boolean;
  }>;
  totale: number;
  totaleIvato: number;
  inviabile: boolean;
}

export default function SifarCatalogPage() {
  const { toast } = useToast();
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: stores = [], isLoading: loadingStores } = useQuery<SifarStore[]>({
    queryKey: ["/api/sifar/stores"],
  });

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreCode) {
      const defaultStore = stores.find(s => s.isDefault) || stores[0];
      setSelectedStoreCode(defaultStore.storeCode);
    }
  }, [stores, selectedStoreCode]);

  const { data: brands = [], isLoading: loadingBrands } = useQuery<SifarBrand[]>({
    queryKey: ["/api/sifar/catalog/brands", selectedStoreCode],
    queryFn: async () => {
      if (!selectedStoreCode) return [];
      const res = await fetch(`/api/sifar/catalog/brands?storeCode=${selectedStoreCode}`);
      if (!res.ok) throw new Error("Errore nel caricamento marchi");
      return res.json();
    },
    enabled: !!selectedStoreCode,
  });

  const { data: models = [], isLoading: loadingModels } = useQuery<SifarModel[]>({
    queryKey: ["/api/sifar/catalog/models", selectedStoreCode, selectedBrand],
    queryFn: async () => {
      if (!selectedStoreCode || !selectedBrand) return [];
      const res = await fetch(`/api/sifar/catalog/models?storeCode=${selectedStoreCode}&brandCode=${selectedBrand}`);
      if (!res.ok) throw new Error("Errore nel caricamento modelli");
      return res.json();
    },
    enabled: !!selectedStoreCode && !!selectedBrand,
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery<SifarArticle[]>({
    queryKey: ["/api/sifar/catalog/articles", selectedStoreCode, selectedModel],
    queryFn: async () => {
      if (!selectedStoreCode || !selectedModel) return [];
      const res = await fetch(`/api/sifar/catalog/articles?storeCode=${selectedStoreCode}&modelCode=${selectedModel}`);
      if (!res.ok) throw new Error("Errore nel caricamento articoli");
      return res.json();
    },
    enabled: !!selectedStoreCode && !!selectedModel,
  });

  const { data: cart, isLoading: loadingCart, refetch: refetchCart } = useQuery<SifarCartDetail>({
    queryKey: ["/api/sifar/cart", selectedStoreCode],
    queryFn: async () => {
      if (!selectedStoreCode) return { articoli: [], totale: 0, totaleIvato: 0, inviabile: false };
      const res = await fetch(`/api/sifar/cart?storeCode=${selectedStoreCode}`);
      if (!res.ok) throw new Error("Errore nel caricamento carrello");
      return res.json();
    },
    enabled: !!selectedStoreCode,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ articleCode, quantity }: { articleCode: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/sifar/cart/add", {
        storeCode: selectedStoreCode,
        articleCode,
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Aggiunto al carrello" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (loadingStores) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Nessun punto vendita configurato. Configura le credenziali SIFAR prima di continuare.</span>
            <Link href="/reseller/sifar/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configura
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Catalogo SIFAR</h1>
            <p className="text-muted-foreground">Sfoglia e ordina ricambi dal catalogo SIFAR</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/reseller/sifar/cart">
            <Button variant="outline" data-testid="button-view-cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrello
              {cart && cart.articoli.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {cart.articoli.reduce((sum, a) => sum + a.quantita, 0)}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/reseller/sifar/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Search className="h-5 w-5" />
            Cerca Ricambi
          </CardTitle>
          <CardDescription>
            Seleziona marca e modello per visualizzare i ricambi disponibili
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Punto Vendita</Label>
              <Select value={selectedStoreCode} onValueChange={(val) => {
                setSelectedStoreCode(val);
                setSelectedBrand("");
                setSelectedModel("");
              }}>
                <SelectTrigger data-testid="select-store">
                  <SelectValue placeholder="Seleziona punto vendita" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.storeCode}>
                      {store.storeName || `Punto Vendita ${store.storeCode}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Select 
                value={selectedBrand} 
                onValueChange={(val) => {
                  setSelectedBrand(val);
                  setSelectedModel("");
                }}
                disabled={!selectedStoreCode || loadingBrands}
              >
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder={loadingBrands ? "Caricamento..." : "Seleziona marca"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand.codiceMarca} value={brand.codiceMarca}>
                      {brand.descMarca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modello</Label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedBrand || loadingModels}
              >
                <SelectTrigger data-testid="select-model">
                  <SelectValue placeholder={loadingModels ? "Caricamento..." : "Seleziona modello"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.codiceModello} value={model.codiceModello}>
                      {model.descModello}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedModel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5" />
              Articoli Disponibili
            </CardTitle>
            {selectedBrand && selectedModel && (
              <CardDescription>
                {brands.find(b => b.codiceMarca === selectedBrand)?.descMarca} - {models.find(m => m.codiceModello === selectedModel)?.descModello}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loadingArticles ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 p-4 border rounded-md">
                    <Skeleton className="h-20 w-20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun articolo trovato per questo modello
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.codiceArticolo}
                    className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                    data-testid={`article-item-${article.codiceArticolo}`}
                  >
                    <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      {article.urlImmagine ? (
                        <img 
                          src={article.urlImmagine} 
                          alt={article.descArticolo}
                          className="h-full w-full object-contain rounded-md"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{article.descArticolo}</h3>
                          <div className="text-sm text-muted-foreground space-y-1 mt-1">
                            <div>Cod: {article.codiceArticolo}</div>
                            {article.ean && <div>EAN: {article.ean}</div>}
                            {article.qualita && (
                              <Badge variant="outline" className="mt-1">
                                {article.qualita}
                              </Badge>
                            )}
                            {article.mesiGaranzia && (
                              <Badge variant="secondary" className="ml-2">
                                Garanzia {article.mesiGaranzia} mesi
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold">
                            {formatPrice(article.prezzoIvato * 100)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(article.prezzo * 100)} + IVA
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {article.disponibile ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Disponibile
                            </Badge>
                          ) : article.contattaPerOrdinare ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Su ordinazione
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Non disponibile
                            </Badge>
                          )}
                          {article.giacenza !== undefined && article.giacenza > 0 && (
                            <span className="text-sm text-muted-foreground">
                              ({article.giacenza} in stock)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [article.codiceArticolo]: Math.max(1, (prev[article.codiceArticolo] || 1) - 1)
                              }))}
                              data-testid={`button-decrease-${article.codiceArticolo}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-12 text-center border-0 p-0"
                              value={quantities[article.codiceArticolo] || 1}
                              onChange={(e) => setQuantities(prev => ({
                                ...prev,
                                [article.codiceArticolo]: Math.max(1, parseInt(e.target.value) || 1)
                              }))}
                              data-testid={`input-quantity-${article.codiceArticolo}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [article.codiceArticolo]: (prev[article.codiceArticolo] || 1) + 1
                              }))}
                              data-testid={`button-increase-${article.codiceArticolo}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCartMutation.mutate({
                              articleCode: article.codiceArticolo,
                              quantity: quantities[article.codiceArticolo] || 1
                            })}
                            disabled={!article.disponibile || addToCartMutation.isPending}
                            data-testid={`button-add-to-cart-${article.codiceArticolo}`}
                          >
                            {addToCartMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Aggiungi
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
