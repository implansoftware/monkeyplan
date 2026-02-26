import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tv,
  Gamepad2,
  Watch,
  Headphones,
  Printer,
  Tag,
  Wrench,
  User,
  CheckCircle,
  Plus,
  Trash2,
  Euro,
  Search,
  Loader2,
  Package,
  Warehouse,
  Truck,
} from "lucide-react";
import {
  SiApple, SiSamsung, SiHuawei, SiXiaomi, SiSony, SiLg,
  SiLenovo, SiDell, SiHp, SiAsus, SiAcer, SiGoogle, SiOneplus,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import type { ServiceItem } from "@shared/schema";
import { useTranslation } from "react-i18next";

const DEVICE_TYPE_ICONS: Record<string, any> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  pc: Monitor,
  tv: Tv,
  console: Gamepad2,
  smartwatch: Watch,
  cuffie: Headphones,
  stampante: Printer,
};

const BRAND_ICONS: Record<string, any> = {
  apple: SiApple,
  samsung: SiSamsung,
  huawei: SiHuawei,
  xiaomi: SiXiaomi,
  sony: SiSony,
  lg: SiLg,
  lenovo: SiLenovo,
  dell: SiDell,
  hp: SiHp,
  asus: SiAsus,
  acer: SiAcer,
  google: SiGoogle,
  oneplus: SiOneplus,
};

function getBrandIcon(brandName: string) {
  const normalized = brandName.toLowerCase().replace(/\s+/g, '');
  return BRAND_ICONS[normalized] || null;
}

interface ServiceItemWithPrice extends ServiceItem {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: "base" | "reseller" | "repair_center";
}

interface QuoteLineItem {
  serviceItemId: string | null;
  productId: string | null;
  itemType: "service" | "product" | "custom";
  name: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRate: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function getSteps(t: (key: string) => string) {
  return [
    { id: "device", label: t("repairs.device"), icon: Smartphone },
    { id: "services", label: t("utility.services"), icon: Wrench },
    { id: "products", label: t("products.title"), icon: Package },
    { id: "customer", label: t("common.customer"), icon: User },
    { id: "summary", label: t("reports.summary"), icon: CheckCircle },
  ];
}

export default function NewStandaloneQuote() {
  const { t } = useTranslation();
  const STEPS = getSteps(t);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);

  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");
  const [marketCodeInput, setMarketCodeInput] = useState("");
  const [marketCodeLoading, setMarketCodeLoading] = useState(false);

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState("30");

  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productTab, setProductTab] = useState("warehouse");

  const { data: deviceTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<any[]>({
    queryKey: ["/api/device-brands"],
  });

  const deviceModelsUrl = (() => {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set("typeId", deviceTypeId);
    if (brandId) params.set("brandId", brandId);
    const qs = params.toString();
    return `/api/device-models${qs ? `?${qs}` : ""}`;
  })();

  const { data: deviceModels = [] } = useQuery<any[]>({
    queryKey: [deviceModelsUrl],
    enabled: !!deviceTypeId || !!brandId,
  });

  const servicesUrl = (() => {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
    if (brandId) params.set("brandId", brandId);
    if (modelId) params.set("modelId", modelId);
    if (serviceSearch) params.set("search", serviceSearch);
    params.set("limit", "50");
    return `/api/service-items?${params}`;
  })();

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceItemWithPrice[]>({
    queryKey: [servicesUrl],
    enabled: currentStep === 1,
  });

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ["/api/warehouses"],
    enabled: currentStep === 2,
  });

  const userWarehouseId = useMemo(() => {
    if (warehouses.length > 0) return warehouses[0].id;
    return null;
  }, [warehouses]);

  const warehouseProductsUrl = (() => {
    if (!userWarehouseId) return null;
    const params = new URLSearchParams();
    if (productSearch) params.set("search", productSearch);
    if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
    const _brand = deviceBrands.find((db: any) => db.id === brandId)?.name;
    if (_brand) params.set("brand", _brand);
    const _model = deviceModels.find((dm: any) => dm.id === modelId)?.modelName;
    if (_model) params.set("modelName", _model);
    params.set("limit", "50");
    return `/api/warehouses/${userWarehouseId}/products?${params}`;
  })();

  const { data: warehouseProducts = [], isLoading: warehouseProductsLoading } = useQuery<any[]>({
    queryKey: [warehouseProductsUrl],
    enabled: currentStep === 2 && !!userWarehouseId && productTab === "warehouse",
  });

  const supplierProductsUrl = (() => {
    const params = new URLSearchParams();
    if (productSearch) params.set("search", productSearch);
    if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
    const _brand = deviceBrands.find((db: any) => db.id === brandId)?.name;
    if (_brand) params.set("brand", _brand);
    const _model = deviceModels.find((dm: any) => dm.id === modelId)?.modelName;
    if (_model) params.set("modelName", _model);
    params.set("limit", "50");
    return `/api/products?${params}`;
  })();

  const { data: allProducts = [], isLoading: allProductsLoading } = useQuery<any[]>({
    queryKey: [supplierProductsUrl],
    enabled: currentStep === 2 && productTab === "supplier",
  });

  const customersUrl = user?.role === "repair_center" || user?.role === "repair_center_staff"
    ? "/api/repair-center/customers"
    : "/api/reseller/customers";

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: [customersUrl],
    enabled: currentStep === 3,
  });

  const addServiceToQuote = (service: ServiceItemWithPrice) => {
    const existing = lineItems.find(li => li.serviceItemId === service.id && li.itemType === "service");
    if (existing) {
      setLineItems(prev => prev.map(li =>
        li.serviceItemId === service.id && li.itemType === "service"
          ? { ...li, quantity: li.quantity + 1 }
          : li
      ));
    } else {
      setLineItems(prev => [...prev, {
        serviceItemId: service.id,
        productId: null,
        itemType: "service",
        name: service.name,
        description: service.description || "",
        quantity: 1,
        unitPriceCents: service.effectivePriceCents || service.defaultPriceCents,
        vatRate: service.vatRate || 22,
      }]);
    }
    toast({ title: t("standalone.addedToQuote", { name: service.name }) });
  };

  const addProductToQuote = (product: any) => {
    const pid = product.id;
    const existing = lineItems.find(li => li.productId === pid && li.itemType === "product");
    if (existing) {
      setLineItems(prev => prev.map(li =>
        li.productId === pid && li.itemType === "product"
          ? { ...li, quantity: li.quantity + 1 }
          : li
      ));
    } else {
      setLineItems(prev => [...prev, {
        serviceItemId: null,
        productId: pid,
        itemType: "product",
        name: product.name || "",
        description: product.description || "",
        quantity: 1,
        unitPriceCents: product.unitPrice || 0,
        vatRate: product.vatRate || 22,
      }]);
    }
    toast({ title: t("standalone.addedToQuote", { name: product.name }) });
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, updates: Partial<QuoteLineItem>) => {
    setLineItems(prev => prev.map((li, i) => i === index ? { ...li, ...updates } : li));
  };

  const addCustomLineItem = () => {
    setLineItems(prev => [...prev, {
      serviceItemId: null,
      productId: null,
      itemType: "custom",
      name: "",
      description: "",
      quantity: 1,
      unitPriceCents: 0,
      vatRate: 22,
    }]);
  };

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.unitPriceCents * li.quantity, 0);
  const vatAmountCents = lineItems.reduce((sum, li) => sum + Math.round(li.unitPriceCents * li.quantity * li.vatRate / 100), 0);
  const totalCents = subtotalCents + vatAmountCents;

  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.fullName || selectedCustomer.username);
      setCustomerEmail(selectedCustomer.email || "");
      setCustomerPhone(selectedCustomer.phone || "");
    }
  }, [selectedCustomer]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const validUntil = validDays
        ? new Date(Date.now() + parseInt(validDays) * 86400000).toISOString()
        : null;

      return apiRequest("POST", "/api/standalone-quotes", {
          customerId: customerId || null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          deviceTypeId: deviceTypeId || null,
          brandId: brandId || null,
          modelId: modelId || null,
          deviceDescription: deviceDescription || null,
          notes: notes || null,
          validUntil,
          status: "draft",
          items: lineItems.map(li => ({
            serviceItemId: li.serviceItemId,
            productId: li.productId,
            itemType: li.itemType,
            name: li.name,
            description: li.description || null,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            vatRate: li.vatRate,
          })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standalone-quotes"] });
      toast({ title: t("standalone.quoteCreated") });
      const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";
      navigate(`${basePath}/standalone-quotes`);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const lookupMarketCode = async () => {
    const code = marketCodeInput.trim();
    if (!code) return;
    setMarketCodeLoading(true);
    try {
      const res = await fetch(`/api/device-models/by-market-code?code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data) {
        toast({ variant: "destructive", title: t("repair.codeNotFound"), description: t("repair.noDeviceWithCode", { code }) });
        return;
      }
      if (data.typeId) setDeviceTypeId(data.typeId);
      if (data.brandId) setBrandId(data.brandId);
      if (data.modelId) setModelId(data.modelId);
      toast({ title: t("repair.deviceFound"), description: `${data.typeName || ""} ${data.brandName || ""} ${data.modelName || ""}`.trim() });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("repair.cannotSearchMarketCode") });
    } finally {
      setMarketCodeLoading(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return lineItems.length > 0 && lineItems.every(li => li.name && li.unitPriceCents >= 0);
      default: return false;
    }
  };

  const deviceTypeName = deviceTypes.find((dt: any) => dt.id === deviceTypeId)?.name || "";
  const brandName = deviceBrands.find((db: any) => db.id === brandId)?.name || "";
  const modelName = deviceModels.find((dm: any) => dm.id === modelId)?.modelName || "";

  const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";

  const serviceItems = lineItems.filter(li => li.itemType === "service");
  const productItems = lineItems.filter(li => li.itemType === "product");
  const customItems = lineItems.filter(li => li.itemType === "custom");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`${basePath}/standalone-quotes`)}
          data-testid="button-back-quotes"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("standalone.newQuote")}</h1>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {idx > 0 && <div className={`h-px w-6 ${isCompleted ? "bg-primary" : "bg-border"}`} />}
              <button
                onClick={() => idx <= currentStep && setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`step-${step.id}`}
              >
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("standalone.selectDevice")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("standalone.selectDeviceDesc")}
            </p>

            <div className="space-y-2">
              <Label>{t("repair.marketCodeOptional")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("repair.marketCodePlaceholder")}
                  value={marketCodeInput}
                  onChange={(e) => setMarketCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupMarketCode())}
                  data-testid="input-market-code-quote"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={lookupMarketCode}
                  disabled={marketCodeLoading || !marketCodeInput.trim()}
                  data-testid="button-lookup-market-code-quote"
                >
                  {marketCodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("repair.enterMarketCodeToAutofill")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("repairs.deviceType")} *</Label>
              <div className="grid gap-2 w-full min-w-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                {deviceTypes.map((type: any) => {
                  const Icon = DEVICE_TYPE_ICONS[type.name.toLowerCase()] || Smartphone;
                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-colors min-w-0 w-full hover-elevate",
                        deviceTypeId === type.id && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setDeviceTypeId(type.id);
                        setBrandId("");
                        setModelId("");
                      }}
                      data-testid={`card-device-type-${type.id}`}
                    >
                      <CardContent className="p-3 text-center">
                        <Icon className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-sm truncate block">{type.name}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {deviceTypeId && (
              <div className="space-y-2">
                <Label>{t("products.brand")}</Label>
                <div className="grid gap-2 w-full min-w-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
                  {deviceBrands.map((brand: any) => {
                    const BrandIcon = getBrandIcon(brand.name);
                    return (
                      <Card
                        key={brand.id}
                        className={cn(
                          "cursor-pointer transition-colors min-w-0 w-full hover-elevate",
                          brandId === brand.id && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          setBrandId(brand.id);
                          setModelId("");
                        }}
                        data-testid={`card-brand-${brand.id}`}
                      >
                        <CardContent className="p-3 text-center">
                          {BrandIcon ? (
                            <BrandIcon className="h-6 w-6 mx-auto mb-1" />
                          ) : brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="h-6 w-6 mx-auto mb-1 object-contain" />
                          ) : (
                            <Tag className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                          )}
                          <span className="text-xs truncate block">{brand.name}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {brandId && (
              <div className="space-y-1.5">
                <Label>{t("products.model")}</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder={t("products.selectModel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceModels.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.modelName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t("standalone.deviceDescriptionLabel")}</Label>
              <Input
                value={deviceDescription}
                onChange={(e) => setDeviceDescription(e.target.value)}
                placeholder={t("standalone.deviceDescriptionPlaceholder")}
                data-testid="input-device-description"
              />
            </div>

            {(deviceTypeId || brandId || modelId) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{t("standalone.selection")}:</span>
                {deviceTypeName && <Badge variant="secondary">{deviceTypeName}</Badge>}
                {brandName && <Badge variant="secondary">{brandName}</Badge>}
                {modelName && <Badge variant="secondary">{modelName}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeviceTypeId(""); setBrandId(""); setModelId(""); }}
                  data-testid="button-clear-device"
                >
                  {t("standalone.clearSelection")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("standalone.compatibleServices")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder={t("products.searchService")}
                  className="pl-9"
                  data-testid="input-search-services"
                />
              </div>

              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("standalone.noServicesFound")}
                </p>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {services.map((service) => {
                    const isAdded = lineItems.some(li => li.serviceItemId === service.id && li.itemType === "service");
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                          isAdded ? "border-primary/50 bg-primary/5" : "hover-elevate"
                        }`}
                        data-testid={`service-card-${service.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>{service.code}</span>
                            <span>{service.category}</span>
                            {service.defaultLaborMinutes > 0 && (
                              <span>{service.defaultLaborMinutes} min</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {formatCurrency(service.effectivePriceCents || service.defaultPriceCents)}
                          </span>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "default"}
                            onClick={() => addServiceToQuote(service)}
                            data-testid={`button-add-service-${service.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {isAdded ? t("standalone.addAgain") : t("common.add")}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">{t("standalone.quoteItems")} ({lineItems.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={addCustomLineItem} data-testid="button-add-custom-item">
                <Plus className="h-4 w-4 mr-1" />
                {t("standalone.customItem")}
              </Button>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("standalone.noItemsAdded")}
                </p>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.itemType === "service" && <Badge variant="secondary">{t("common.service")}</Badge>}
                          {item.itemType === "product" && <Badge variant="outline">{t("common.product")}</Badge>}
                          {item.itemType === "custom" && <Badge variant="secondary">{t("suppliers.custom")}</Badge>}
                          {item.itemType === "custom" ? (
                            <Input
                              value={item.name}
                              onChange={(e) => updateLineItem(idx, { name: e.target.value })}
                              placeholder={t("standalone.customItemName")}
                              className="flex-1"
                              data-testid={`input-item-name-${idx}`}
                            />
                          ) : (
                            <span className="font-medium text-sm">{item.name}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">{t("common.quantity")}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              data-testid={`input-item-qty-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t("standalone.unitPriceEur")}</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={(item.unitPriceCents / 100).toFixed(2)}
                              onChange={(e) => updateLineItem(idx, { unitPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                              data-testid={`input-item-price-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">IVA %</Label>
                            <Select
                              value={String(item.vatRate)}
                              onValueChange={(v) => updateLineItem(idx, { vatRate: parseFloat(v) })}
                            >
                              <SelectTrigger data-testid={`select-vat-${idx}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="22">22%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="4">4%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {t("common.total")}: {formatCurrency(item.unitPriceCents * item.quantity)} + {t("standalone.vat")} {formatCurrency(Math.round(item.unitPriceCents * item.quantity * item.vatRate / 100))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(idx)}
                        data-testid={`button-remove-item-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <div className="text-sm">{t("standalone.taxableAmount")}: <span className="font-semibold" data-testid="text-subtotal">{formatCurrency(subtotalCents)}</span></div>
                      <div className="text-sm">{t("standalone.vat")}: <span className="font-semibold" data-testid="text-vat">{formatCurrency(vatAmountCents)}</span></div>
                      <div className="text-lg font-bold" data-testid="text-total">{t("common.total")}: {formatCurrency(totalCents)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("standalone.addProducts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("standalone.addProductsDesc")}
              </p>

              <Tabs value={productTab} onValueChange={setProductTab}>
                <TabsList>
                  <TabsTrigger value="warehouse" data-testid="tab-warehouse">
                    <Warehouse className="h-4 w-4 mr-1.5" />{t("sidebar.items.myWarehouse")}</TabsTrigger>
                  <TabsTrigger value="supplier" data-testid="tab-supplier">
                    <Truck className="h-4 w-4 mr-1.5" />
                    {t("standalone.supplierCatalog")}
                  </TabsTrigger>
                </TabsList>

                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={t("products.searchProduct")}
                    className="pl-9"
                    data-testid="input-search-products"
                  />
                </div>

                <TabsContent value="warehouse" className="mt-3">
                  {!userWarehouseId ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("standalone.noWarehouseFound")}
                    </p>
                  ) : warehouseProductsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : warehouseProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {productSearch ? t("standalone.noProductsInWarehouse") : t("standalone.warehouseEmpty")}
                    </p>
                  ) : (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                      {warehouseProducts.map((product: any) => {
                        const pid = product.productId || product.id;
                        const isAdded = lineItems.some(li => li.productId === pid && li.itemType === "product");
                        return (
                          <div
                            key={pid}
                            className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                              isAdded ? "border-primary/50 bg-primary/5" : "hover-elevate"
                            }`}
                            data-testid={`warehouse-product-${pid}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                {product.sku && <span>{product.sku}</span>}
                                {product.category && <span>{product.category}</span>}
                                {product.brand && <span>{product.brand}</span>}
                                {product.availableQuantity != null && (
                                  <span>{t("standalone.available")}: {product.availableQuantity}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-semibold">
                                {formatCurrency(product.unitPrice || 0)}
                              </span>
                              <Button
                                size="sm"
                                variant={isAdded ? "secondary" : "default"}
                                onClick={() => addProductToQuote(product)}
                                data-testid={`button-add-warehouse-product-${pid}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {isAdded ? t("standalone.addAgain") : t("common.add")}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="supplier" className="mt-3">
                  {allProductsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : allProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {productSearch ? t("standalone.noProductsInCatalog") : t("standalone.catalogEmpty")}
                    </p>
                  ) : (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                      {allProducts.map((product: any) => {
                        const pid = product.id;
                        const isAdded = lineItems.some(li => li.productId === pid && li.itemType === "product");
                        return (
                          <div
                            key={pid}
                            className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                              isAdded ? "border-primary/50 bg-primary/5" : "hover-elevate"
                            }`}
                            data-testid={`supplier-product-${pid}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                {product.sku && <span>{product.sku}</span>}
                                {product.category && <span>{product.category}</span>}
                                {product.brand && <span>{product.brand}</span>}
                                {product.supplier && (
                                  <span className="flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    {product.supplier}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-semibold">
                                {formatCurrency(product.unitPrice || 0)}
                              </span>
                              <Button
                                size="sm"
                                variant={isAdded ? "secondary" : "default"}
                                onClick={() => addProductToQuote(product)}
                                data-testid={`button-add-supplier-product-${pid}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {isAdded ? t("standalone.addAgain") : t("common.add")}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {lineItems.filter(li => li.itemType === "product").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("standalone.selectedProducts")} ({lineItems.filter(li => li.itemType === "product").length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lineItems.map((item, idx) => {
                    if (item.itemType !== "product") return null;
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{t("common.product")}</Badge>
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">{t("common.quantity")}</Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateLineItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                data-testid={`input-product-qty-${idx}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{t("standalone.unitPriceEur")}</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={(item.unitPriceCents / 100).toFixed(2)}
                                onChange={(e) => updateLineItem(idx, { unitPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                data-testid={`input-product-price-${idx}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">IVA %</Label>
                              <Select
                                value={String(item.vatRate)}
                                onValueChange={(v) => updateLineItem(idx, { vatRate: parseFloat(v) })}
                              >
                                <SelectTrigger data-testid={`select-product-vat-${idx}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="22">22%</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="4">4%</SelectItem>
                                  <SelectItem value="0">0%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {t("common.total")}: {formatCurrency(item.unitPriceCents * item.quantity)} + {t("standalone.vat")} {formatCurrency(Math.round(item.unitPriceCents * item.quantity * item.vatRate / 100))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(idx)}
                          data-testid={`button-remove-product-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("standalone.customerData")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("standalone.customerDataDesc")}
            </p>
            <div className="space-y-1.5">
              <Label>{t("standalone.existingCustomer")}</Label>
              <Select value={customerId} onValueChange={(v) => {
                if (v === "__none__") {
                  setCustomerId("");
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                } else {
                  setCustomerId(v);
                }
              }}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder={t("standalone.selectCustomerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("standalone.noCustomer")}</SelectItem>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName || c.username} {c.email ? `(${c.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{t("common.name")}</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("auth.fullName")}
                  disabled={!!customerId}
                  data-testid="input-customer-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.email")}</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder={t("common.emailPlaceholder")}
                  disabled={!!customerId}
                  data-testid="input-customer-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.phone")}</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t("common.phonePlaceholder")}
                  disabled={!!customerId}
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("standalone.notesPlaceholder")}
                rows={3}
                data-testid="input-notes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("standalone.validityDays")}</Label>
              <Select value={validDays} onValueChange={setValidDays}>
                <SelectTrigger data-testid="select-validity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 {t("standalone.days")}</SelectItem>
                  <SelectItem value="15">15 {t("standalone.days")}</SelectItem>
                  <SelectItem value="30">30 {t("standalone.days")}</SelectItem>
                  <SelectItem value="60">60 {t("standalone.days")}</SelectItem>
                  <SelectItem value="90">90 {t("standalone.days")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("standalone.quoteSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(deviceTypeName || brandName || modelName || deviceDescription) && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" />{t("repairs.device")}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {deviceTypeName && <Badge variant="secondary">{deviceTypeName}</Badge>}
                  {brandName && <Badge variant="secondary">{brandName}</Badge>}
                  {modelName && <Badge variant="secondary">{modelName}</Badge>}
                </div>
                {deviceDescription && <p className="text-sm text-muted-foreground">{deviceDescription}</p>}
              </div>
            )}

            <Separator />

            {serviceItems.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> {t("utility.services")} ({serviceItems.length})</h3>
                <div className="space-y-2">
                  {serviceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productItems.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> {t("products.title")} ({productItems.length})</h3>
                  <div className="space-y-2">
                    {productItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {customItems.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> {t("standalone.customItems")} ({customItems.length})</h3>
                  <div className="space-y-2">
                    {customItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <div className="text-sm">{t("standalone.taxableAmount")}: <span className="font-semibold" data-testid="text-summary-subtotal">{formatCurrency(subtotalCents)}</span></div>
                <div className="text-sm">{t("standalone.vat")}: <span className="font-semibold" data-testid="text-summary-vat">{formatCurrency(vatAmountCents)}</span></div>
                <div className="text-lg font-bold flex items-center gap-1 justify-end" data-testid="text-summary-total">
                  <Euro className="h-5 w-5" />
                  {t("common.total")}: {formatCurrency(totalCents)}
                </div>
              </div>
            </div>

            <Separator />

            {(customerName || customerEmail) && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" />{t("common.customer")}</h3>
                <div className="text-sm space-y-0.5">
                  {customerName && <p>{customerName}</p>}
                  {customerEmail && <p className="text-muted-foreground">{customerEmail}</p>}
                  {customerPhone && <p className="text-muted-foreground">{customerPhone}</p>}
                </div>
              </div>
            )}
            {!customerName && !customerEmail && (
              <p className="text-sm text-muted-foreground">{t("admin.resellerDetail.noCustomersFound")}</p>
            )}

            {notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{t("common.notes")}</h3>
                  <p className="text-sm text-muted-foreground">{notes}</p>
                </div>
              </>
            )}

            <p className="text-sm text-muted-foreground">
              {t("standalone.validityFromCreation", { days: validDays })}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
          data-testid="button-prev-step"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canGoNext()}
            data-testid="button-next-step"
          >{t("common.next")}<ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || lineItems.length === 0}
            data-testid="button-create-quote"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            {t("standalone.createQuote")}
          </Button>
        )}
      </div>
    </div>
  );
}
