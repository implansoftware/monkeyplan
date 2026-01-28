import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileCheck,
  Package,
  User,
  Euro,
  ClipboardList,
  Plus,
  Trash2,
  Building2,
  User2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import type { UtilitySupplier, UtilityService, User as UserType, Product } from "@shared/schema";

interface UtilityPracticeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type WizardStep = "type" | "service" | "customer" | "pricing" | "review";
type ItemType = "service" | "product" | "service_with_products";
type PriceType = "mensile" | "forfait" | "attivazione";

interface PracticeProductItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
}

const STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: "type", label: "Tipo", icon: ClipboardList },
  { id: "service", label: "Servizio", icon: FileCheck },
  { id: "customer", label: "Cliente", icon: User },
  { id: "pricing", label: "Prezzo", icon: Euro },
  { id: "review", label: "Riepilogo", icon: Check },
];

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

export function UtilityPracticeWizard({ open, onOpenChange, onSuccess }: UtilityPracticeWizardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  
  const [selectedItemType, setSelectedItemType] = useState<ItemType>("service");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [useTemporarySupplier, setUseTemporarySupplier] = useState(false);
  const [temporarySupplierName, setTemporarySupplierName] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [useCustomService, setUseCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [practiceProducts, setPracticeProducts] = useState<PracticeProductItem[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [useTemporaryCustomer, setUseTemporaryCustomer] = useState(false);
  const [temporaryCustomerName, setTemporaryCustomerName] = useState("");
  const [temporaryCustomerEmail, setTemporaryCustomerEmail] = useState("");
  const [temporaryCustomerPhone, setTemporaryCustomerPhone] = useState("");
  
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>("mensile");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [flatPrice, setFlatPrice] = useState("");
  const [activationPrice, setActivationPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("bozza");
  const [notes, setNotes] = useState("");
  
  
  // Sub-reseller and repair center selection (for franchising/gdo resellers)
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState("");
  const [targetType, setTargetType] = useState<"self" | "sub-reseller" | "repair-center">("self");

  // Query sub-resellers for franchising/gdo resellers
  const { data: subResellers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/reseller/sub-resellers"],
    enabled: open && user?.role === 'reseller' && 
             (user?.resellerCategory === 'franchising' || user?.resellerCategory === 'gdo'),
    select: (data: any) => data || [],
  });

  // Query repair centers for franchising/gdo resellers
  const { data: repairCenters = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/repair-centers"],
    enabled: open && user?.role === 'reseller' && 
             (user?.resellerCategory === 'franchising' || user?.resellerCategory === 'gdo'),
    select: (data: any) => data || [],
  });

  // Set default to self when wizard opens
  useEffect(() => {
    if (open && user?.id) {
      setTargetType("self");
      setSelectedResellerId("");
      setSelectedRepairCenterId("");
    }
  }, [open, user?.id]);

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
    enabled: open,
  });

  const { data: allServices = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
    enabled: open,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  // Select endpoint based on user role
  const customerEndpoint = (user?.role === "reseller" || user?.role === "reseller_staff") 
    ? "/api/reseller/customers" 
    : (user?.role === "repair_center" ? "/api/repair-center/customers" : "/api/customers");
  
  const { data: customerUsers = [] } = useQuery<UserType[]>({
    queryKey: [customerEndpoint],
    enabled: open,
  });

  const services = selectedSupplierId
    ? allServices.filter((s) => s.supplierId === selectedSupplierId)
    : allServices;

  const selectedService = useMemo(() => 
    allServices.find(s => s.id === selectedServiceId),
    [allServices, selectedServiceId]
  );

  useEffect(() => {
    if (selectedServiceId && selectedService && !useCustomService) {
      if (selectedService.priceType) {
        setSelectedPriceType(selectedService.priceType as PriceType);
      }
      if (selectedService.monthlyPriceCents) {
        setMonthlyPrice((selectedService.monthlyPriceCents / 100).toFixed(2));
      }
      if (selectedService.flatPriceCents) {
        setFlatPrice((selectedService.flatPriceCents / 100).toFixed(2));
      }
      if (selectedService.activationFeeCents) {
        setActivationPrice((selectedService.activationFeeCents / 100).toFixed(2));
      }
      // Calcolo commissione: priorità a commissionFixed, altrimenti calcola da percentuale
      if (selectedService.commissionFixed) {
        setCommission((selectedService.commissionFixed / 100).toFixed(2));
      } else if (selectedService.commissionOneTime) {
        // Per servizi con solo attivazione, usa commissionOneTime
        setCommission((selectedService.commissionOneTime / 100).toFixed(2));
      } else if (selectedService.commissionPercent) {
        // Calcola commissione su prezzo mensile o attivazione
        const baseCents = selectedService.monthlyPriceCents || selectedService.activationFeeCents || 0;
        const commissionCents = (baseCents * selectedService.commissionPercent) / 100;
        setCommission((commissionCents / 100).toFixed(2));
      }
    }
  }, [selectedServiceId, selectedService, useCustomService]);

  const resetForm = () => {
    setCurrentStep("type");
    setSelectedItemType("service");
    setSelectedSupplierId("");
    setUseTemporarySupplier(false);
    setTemporarySupplierName("");
    setSelectedServiceId("");
    setUseCustomService(false);
    setCustomServiceName("");
    setPracticeProducts([]);
    setSelectedCustomerId("");
    setUseTemporaryCustomer(false);
    setTemporaryCustomerName("");
    setTemporaryCustomerEmail("");
    setTemporaryCustomerPhone("");
    setSelectedPriceType("mensile");
    setMonthlyPrice("");
    setFlatPrice("");
    setActivationPrice("");
    setCommission("");
    setSupplierReference("");
    setSelectedStatus("bozza");
    setNotes("");
    setTargetType("self");
    setSelectedResellerId("");
    setSelectedRepairCenterId("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/utility/practices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Pratica creata", description: "La pratica è stata creata con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addProduct = () => {
    setPracticeProducts([...practiceProducts, { productId: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeProduct = (index: number) => {
    setPracticeProducts(practiceProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof PracticeProductItem, value: any) => {
    const updated = [...practiceProducts];
    updated[index] = { ...updated[index], [field]: value };
    setPracticeProducts(updated);
  };

  const calculateProductsTotal = () => {
    return practiceProducts.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "type":
        // Validate target selection for franchising/gdo resellers
        if (targetType === "sub-reseller" && !selectedResellerId) return false;
        if (targetType === "repair-center" && !selectedRepairCenterId) return false;
        return true;
      case "service":
        if (selectedItemType === "service" || selectedItemType === "service_with_products") {
          const hasSupplier = useTemporarySupplier ? temporarySupplierName.trim() : selectedSupplierId;
          const hasService = useCustomService ? customServiceName.trim() : selectedServiceId;
          if (!hasSupplier || !hasService) return false;
        }
        if (selectedItemType === "product" || selectedItemType === "service_with_products") {
          if (practiceProducts.length === 0 || practiceProducts.some(p => !p.productId)) return false;
        }
        return true;
      case "customer":
        return useTemporaryCustomer ? !!temporaryCustomerName.trim() : !!selectedCustomerId;
      case "pricing":
        if (selectedPriceType === "mensile" && !monthlyPrice) return false;
        if (selectedPriceType === "forfait" && !flatPrice) return false;
        if (selectedPriceType === "attivazione" && !activationPrice) return false;
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const getStepIndex = (step: WizardStep) => STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    if (!canProceed()) return;
    
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const goBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = () => {
    const data: any = {
      itemType: selectedItemType,
      status: selectedStatus,
      notes: notes.trim() || undefined,
      supplierReference: supplierReference.trim() || undefined,
      priceType: selectedPriceType,
    };

    // Include resellerId or repairCenterId based on target selection
    if (targetType === "sub-reseller" && selectedResellerId) {
      data.resellerId = selectedResellerId;
    } else if (targetType === "repair-center" && selectedRepairCenterId) {
      data.repairCenterId = selectedRepairCenterId;
    }

    if (selectedItemType === "service" || selectedItemType === "service_with_products") {
      if (useTemporarySupplier && temporarySupplierName.trim()) {
        data.temporarySupplierName = temporarySupplierName.trim();
      } else if (selectedSupplierId) {
        data.supplierId = selectedSupplierId;
      }

      if (useCustomService && customServiceName.trim()) {
        data.customServiceName = customServiceName.trim();
      } else if (selectedServiceId) {
        data.serviceId = selectedServiceId;
      }
    }

    if (useTemporaryCustomer && temporaryCustomerName.trim()) {
      data.temporaryCustomerName = temporaryCustomerName.trim();
      data.temporaryCustomerEmail = temporaryCustomerEmail.trim() || undefined;
      data.temporaryCustomerPhone = temporaryCustomerPhone.trim() || undefined;
    } else if (selectedCustomerId) {
      data.customerId = selectedCustomerId;
    }

    if (selectedPriceType === "mensile") {
      const price = parseFloat(monthlyPrice) || 0;
      data.monthlyPriceCents = Math.round(price * 100);
    } else if (selectedPriceType === "forfait") {
      const price = parseFloat(flatPrice) || 0;
      data.flatPriceCents = Math.round(price * 100);
    } else if (selectedPriceType === "attivazione") {
      const price = parseFloat(activationPrice) || 0;
      data.activationFeeCents = Math.round(price * 100);
    }

    if (commission) {
      const comm = parseFloat(commission) || 0;
      data.commissionCents = Math.round(comm * 100);
    }

    if (practiceProducts.length > 0) {
      const validProducts = practiceProducts
        .filter(p => p.productId)
        .map(p => ({
          productId: p.productId,
          quantity: typeof p.quantity === 'number' ? p.quantity : parseInt(String(p.quantity)) || 1,
          unitPriceCents: typeof p.unitPriceCents === 'number' ? p.unitPriceCents : parseInt(String(p.unitPriceCents)) || 0,
          notes: p.notes?.trim() || null,
        }));
      
      if (validProducts.length > 0) {
        data.products = validProducts;
      }
    }

    createMutation.mutate(data);
  };

  const getSelectedSupplierName = () => {
    if (useTemporarySupplier) return temporarySupplierName;
    return suppliers.find(s => s.id === selectedSupplierId)?.name || "";
  };

  const getSelectedServiceName = () => {
    if (useCustomService) return customServiceName;
    return allServices.find(s => s.id === selectedServiceId)?.name || "";
  };

  const getSelectedCustomerName = () => {
    if (useTemporaryCustomer) return temporaryCustomerName;
    return customerUsers.find(c => c.id === selectedCustomerId)?.fullName || "";
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isPast = getStepIndex(currentStep) > index;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-1 ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isPast ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTypeStep = () => (
    <div className="space-y-6">
      {/* Target selection for franchising/gdo resellers */}
      {user?.role === 'reseller' && 
       (user?.resellerCategory === 'franchising' || user?.resellerCategory === 'gdo') && 
       (subResellers.length > 0 || repairCenters.length > 0) && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <Label className="text-sm font-medium block">Per chi stai creando la pratica?</Label>
            
            {/* Target type selection */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={targetType === "self" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTargetType("self");
                  setSelectedResellerId("");
                  setSelectedRepairCenterId("");
                }}
                data-testid="button-target-self"
              >
                <User2 className="h-4 w-4 mr-1" />
                Me stesso
              </Button>
              {subResellers.length > 0 && (
                <Button
                  type="button"
                  variant={targetType === "sub-reseller" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTargetType("sub-reseller");
                    setSelectedRepairCenterId("");
                  }}
                  data-testid="button-target-subreseller"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Sub-Rivenditore
                </Button>
              )}
              {repairCenters.length > 0 && (
                <Button
                  type="button"
                  variant={targetType === "repair-center" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTargetType("repair-center");
                    setSelectedResellerId("");
                  }}
                  data-testid="button-target-repaircenter"
                >
                  <Loader2 className="h-4 w-4 mr-1" />
                  Centro Riparazione
                </Button>
              )}
            </div>

            {/* Sub-reseller selection dropdown */}
            {targetType === "sub-reseller" && subResellers.length > 0 && (
              <Select
                value={selectedResellerId}
                onValueChange={setSelectedResellerId}
              >
                <SelectTrigger data-testid="select-subreseller">
                  <SelectValue placeholder="Seleziona sub-rivenditore" />
                </SelectTrigger>
                <SelectContent>
                  {subResellers.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id} data-testid={`select-subreseller-${sub.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{sub.fullName || sub.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Repair center selection dropdown */}
            {targetType === "repair-center" && repairCenters.length > 0 && (
              <Select
                value={selectedRepairCenterId}
                onValueChange={setSelectedRepairCenterId}
              >
                <SelectTrigger data-testid="select-repaircenter">
                  <SelectValue placeholder="Seleziona centro riparazione" />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters.map((center: any) => (
                    <SelectItem key={center.id} value={center.id} data-testid={`select-repaircenter-${center.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{center.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Che tipo di pratica vuoi creare?</h3>
        <p className="text-sm text-muted-foreground">Seleziona una delle opzioni seguenti</p>
      </div>
      
      <div className="grid gap-4">
        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            selectedItemType === "service" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedItemType("service")}
          data-testid="card-type-service"
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full ${selectedItemType === "service" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <FileCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Servizio</h4>
              <p className="text-sm text-muted-foreground">Attivazione di un servizio utility (telefonia, luce, gas, ecc.)</p>
            </div>
            {selectedItemType === "service" && <CheckCircle2 className="h-5 w-5 text-primary" />}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            selectedItemType === "product" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedItemType("product")}
          data-testid="card-type-product"
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full ${selectedItemType === "product" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Prodotto</h4>
              <p className="text-sm text-muted-foreground">Vendita di un prodotto (SIM, modem, router, ecc.)</p>
            </div>
            {selectedItemType === "product" && <CheckCircle2 className="h-5 w-5 text-primary" />}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            selectedItemType === "service_with_products" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedItemType("service_with_products")}
          data-testid="card-type-service-with-products"
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full ${selectedItemType === "service_with_products" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div className="flex">
                <FileCheck className="h-5 w-5" />
                <Package className="h-5 w-5 -ml-1" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Servizio + Prodotti</h4>
              <p className="text-sm text-muted-foreground">Attivazione servizio con prodotti inclusi</p>
            </div>
            {selectedItemType === "service_with_products" && <CheckCircle2 className="h-5 w-5 text-primary" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderServiceStep = () => (
    <div className="space-y-6">
      {(selectedItemType === "service" || selectedItemType === "service_with_products") && (
        <>
          <div>
            <h3 className="text-lg font-medium mb-4">Seleziona Fornitore e Servizio</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fornitore</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <Button
                    type="button"
                    variant={!useTemporarySupplier ? "default" : "outline"}
                    onClick={() => {
                      setUseTemporarySupplier(false);
                      setTemporarySupplierName("");
                    }}
                    data-testid="button-supplier-catalog"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Da Catalogo
                  </Button>
                  <Button
                    type="button"
                    variant={useTemporarySupplier ? "default" : "outline"}
                    onClick={() => {
                      setUseTemporarySupplier(true);
                      setSelectedSupplierId("");
                    }}
                    data-testid="button-supplier-temporary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Temporaneo
                  </Button>
                </div>
                
                {useTemporarySupplier ? (
                  <div className="relative">
                    <Input
                      value={temporarySupplierName}
                      onChange={(e) => setTemporarySupplierName(e.target.value)}
                      placeholder="Nome fornitore (es: TIM, Vodafone, Enel...)"
                      data-testid="input-temporary-supplier"
                    />
                    {temporarySupplierName.length >= 2 && (() => {
                      const matches = suppliers.filter(s => 
                        s.isActive && s.name.toLowerCase().includes(temporarySupplierName.toLowerCase())
                      ).slice(0, 5);
                      if (matches.length === 0) return null;
                      return (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                          <div className="p-2 text-xs text-muted-foreground border-b bg-muted">
                            Fornitori esistenti trovati - clicca per selezionare:
                          </div>
                          {matches.map(supplier => (
                            <button
                              key={supplier.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover-elevate flex items-center gap-2"
                              onClick={() => {
                                setUseTemporarySupplier(false);
                                setSelectedSupplierId(supplier.id);
                                setTemporarySupplierName("");
                              }}
                              data-testid={`suggestion-supplier-${supplier.id}`}
                            >
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{supplier.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca fornitore..."
                        value={supplierSearchQuery}
                        onChange={(e) => setSupplierSearchQuery(e.target.value)}
                        className="pl-8"
                        data-testid="input-supplier-search"
                      />
                    </div>
                    <ScrollArea className="h-[180px] rounded-md border p-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2">
                        {suppliers
                          .filter(s => s.isActive && (supplierSearchQuery === "" || s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())))
                          .map((supplier) => (
                          <Card
                            key={supplier.id}
                            className={`cursor-pointer transition-all hover-elevate p-3 ${
                              selectedSupplierId === supplier.id ? "ring-2 ring-primary bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              setSelectedSupplierId(supplier.id);
                              setSelectedServiceId("");
                            }}
                            data-testid={`card-supplier-${supplier.id}`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{supplier.name}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                      {suppliers.filter(s => s.isActive && (supplierSearchQuery === "" || s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()))).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Nessun fornitore trovato
                        </div>
                      )}
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">
                      {suppliers.filter(s => s.isActive).length} fornitori disponibili
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Servizio</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <Button
                    type="button"
                    variant={!useCustomService ? "default" : "outline"}
                    onClick={() => {
                      setUseCustomService(false);
                      setCustomServiceName("");
                    }}
                    data-testid="button-service-catalog"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Da Catalogo
                  </Button>
                  <Button
                    type="button"
                    variant={useCustomService ? "default" : "outline"}
                    onClick={() => {
                      setUseCustomService(true);
                      setSelectedServiceId("");
                    }}
                    data-testid="button-service-custom"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Temporaneo
                  </Button>
                </div>

                {useCustomService ? (
                  <Input
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="Nome del servizio (es: Fibra 1Gbps)"
                    data-testid="input-custom-service"
                  />
                ) : (
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!selectedSupplierId && !useTemporarySupplier}>
                    <SelectTrigger data-testid="select-service">
                      <SelectValue placeholder={selectedSupplierId ? "Seleziona servizio" : "Prima seleziona un fornitore"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.isActive).map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({categoryLabels[service.category] || service.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {(selectedItemType === "product" || selectedItemType === "service_with_products") && (
        <div className="space-y-4">
          {selectedItemType === "service_with_products" && <Separator />}
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Prodotti</h3>
              <p className="text-sm text-muted-foreground">Aggiungi i prodotti da includere nella pratica</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addProduct} data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi
            </Button>
          </div>

          {practiceProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nessun prodotto aggiunto. Clicca "Aggiungi" per iniziare.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {practiceProducts.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline">Prodotto {index + 1}</Badge>
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
                        <Label className="text-xs">Prezzo Unit.</Label>
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
                  </CardContent>
                </Card>
              ))}
              
              {practiceProducts.length > 0 && (
                <div className="flex justify-end pt-2">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground mr-2">Totale Prodotti:</span>
                    <span className="font-bold text-lg">{formatCurrency(calculateProductsTotal())}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Chi è il cliente?</h3>
        <p className="text-sm text-muted-foreground">Seleziona un cliente esistente o inserisci i dati manualmente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          type="button"
          variant={!useTemporaryCustomer ? "default" : "outline"}
          onClick={() => {
            setUseTemporaryCustomer(false);
            setTemporaryCustomerName("");
            setTemporaryCustomerEmail("");
            setTemporaryCustomerPhone("");
          }}
          className="h-auto py-4"
          data-testid="button-customer-catalog"
        >
          <div className="flex flex-col items-center gap-2">
            <User className="h-6 w-6" />
            <span>Da Anagrafica</span>
          </div>
        </Button>
        <Button
          type="button"
          variant={useTemporaryCustomer ? "default" : "outline"}
          onClick={() => {
            setUseTemporaryCustomer(true);
            setSelectedCustomerId("");
          }}
          className="h-auto py-4"
          data-testid="button-customer-temporary"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-6 w-6" />
            <span>Temporaneo</span>
          </div>
        </Button>
      </div>

      {useTemporaryCustomer ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Label>Nome Cliente *</Label>
              <Input
                value={temporaryCustomerName}
                onChange={(e) => setTemporaryCustomerName(e.target.value)}
                placeholder="Nome e cognome"
                data-testid="input-temporary-customer-name"
              />
              {temporaryCustomerName.length >= 2 && (() => {
                const matches = customerUsers.filter(c => 
                  c.fullName?.toLowerCase().includes(temporaryCustomerName.toLowerCase()) ||
                  c.email?.toLowerCase().includes(temporaryCustomerName.toLowerCase())
                ).slice(0, 5);
                if (matches.length === 0) return null;
                return (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b bg-muted">
                      Clienti esistenti trovati - clicca per selezionare:
                    </div>
                    {matches.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover-elevate flex items-center gap-2"
                        onClick={() => {
                          setUseTemporaryCustomer(false);
                          setSelectedCustomerId(customer.id);
                          setTemporaryCustomerName("");
                          setTemporaryCustomerEmail("");
                          setTemporaryCustomerPhone("");
                        }}
                        data-testid={`suggestion-customer-${customer.id}`}
                      >
                        <User2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{customer.fullName}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Email</Label>
                <Input
                  type="email"
                  value={temporaryCustomerEmail}
                  onChange={(e) => setTemporaryCustomerEmail(e.target.value)}
                  placeholder="email@esempio.it"
                  data-testid="input-temporary-customer-email"
                />
              </div>
              <div>
                <Label className="text-sm">Telefono</Label>
                <Input
                  value={temporaryCustomerPhone}
                  onChange={(e) => setTemporaryCustomerPhone(e.target.value)}
                  placeholder="+39..."
                  data-testid="input-temporary-customer-phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customerUsers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Nessun cliente in anagrafica. Usa l'opzione "Temporaneo".
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseTemporaryCustomer(true)}
                >
                  Inserisci cliente temporaneo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 p-1">
              {customerUsers.slice(0, 10).map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer transition-all hover-elevate ${
                    selectedCustomerId === customer.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  data-testid={`card-customer-${customer.id}`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.fullName}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    {selectedCustomerId === customer.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPricingStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Dettagli Prezzo</h3>
        <p className="text-sm text-muted-foreground">Inserisci il tipo di prezzo e i dettagli</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Tipo Prezzo</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={selectedPriceType === "mensile" ? "default" : "outline"}
              onClick={() => setSelectedPriceType("mensile")}
              className="h-auto py-4"
              data-testid="button-price-mensile"
            >
              <div className="flex flex-col items-center gap-2">
                <Euro className="h-6 w-6" />
                <span>Mensile</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={selectedPriceType === "forfait" ? "default" : "outline"}
              onClick={() => setSelectedPriceType("forfait")}
              className="h-auto py-4"
              data-testid="button-price-forfait"
            >
              <div className="flex flex-col items-center gap-2">
                <Euro className="h-6 w-6" />
                <span>Forfait</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={selectedPriceType === "attivazione" ? "default" : "outline"}
              onClick={() => setSelectedPriceType("attivazione")}
              className="h-auto py-4"
              data-testid="button-price-attivazione"
            >
              <div className="flex flex-col items-center gap-2">
                <Euro className="h-6 w-6" />
                <span>Attivazione</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedPriceType === "mensile" && (
            <div className="space-y-2">
              <Label>Prezzo Mensile (EUR) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="0.00"
                data-testid="input-monthly-price"
                disabled={!!selectedServiceId && !useCustomService}
              />
              {selectedServiceId && !useCustomService && (
                <p className="text-xs text-muted-foreground">Prezzo definito dal listino</p>
              )}
            </div>
          )}
          {selectedPriceType === "forfait" && (
            <div className="space-y-2">
              <Label>Prezzo Forfait (EUR) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={flatPrice}
                onChange={(e) => setFlatPrice(e.target.value)}
                placeholder="0.00"
                data-testid="input-flat-price"
                disabled={!!selectedServiceId && !useCustomService}
              />
              {selectedServiceId && !useCustomService && (
                <p className="text-xs text-muted-foreground">Prezzo definito dal listino</p>
              )}
            </div>
          )}
          {selectedPriceType === "attivazione" && (
            <div className="space-y-2">
              <Label>Costo Attivazione (EUR) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={activationPrice}
                onChange={(e) => setActivationPrice(e.target.value)}
                placeholder="0.00"
                data-testid="input-activation-price"
                disabled={!!selectedServiceId && !useCustomService}
              />
              {selectedServiceId && !useCustomService && (
                <p className="text-xs text-muted-foreground">Prezzo definito dal listino</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Commissione (EUR)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="0.00"
              data-testid="input-commission"
              disabled={!!selectedServiceId && !useCustomService}
            />
            {selectedServiceId && !useCustomService && (
              <p className="text-xs text-muted-foreground">Commissione definita dal listino</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rif. Fornitore</Label>
            <Input
              value={supplierReference}
              onChange={(e) => setSupplierReference(e.target.value)}
              placeholder="Codice pratica fornitore"
              data-testid="input-supplier-reference"
            />
          </div>
          <div className="space-y-2">
            <Label>Stato</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bozza">Bozza</SelectItem>
                <SelectItem value="inviata">Inviata</SelectItem>
                <SelectItem value="in_lavorazione">In Lavorazione</SelectItem>
                <SelectItem value="completata">Completata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Note</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note aggiuntive..."
            rows={3}
            data-testid="input-notes"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Riepilogo Pratica</h3>
        <p className="text-sm text-muted-foreground">Verifica i dati prima di creare la pratica</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-medium">Tipo Pratica</span>
            </div>
            <Badge>
              {selectedItemType === "service" ? "Servizio" : 
               selectedItemType === "product" ? "Prodotto" : "Servizio + Prodotti"}
            </Badge>
          </CardContent>
        </Card>

        {(selectedItemType === "service" || selectedItemType === "service_with_products") && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Fornitore e Servizio</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Fornitore</p>
                  <p className="font-medium">{getSelectedSupplierName() || "-"}</p>
                  {useTemporarySupplier && <Badge variant="outline" className="mt-1">Temporaneo</Badge>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Servizio</p>
                  <p className="font-medium">{getSelectedServiceName() || "-"}</p>
                  {useCustomService && <Badge variant="outline" className="mt-1">Temporaneo</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {practiceProducts.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-2">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Prodotti ({practiceProducts.length})</span>
              </div>
              <div className="space-y-2">
                {practiceProducts.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{product?.name || "Prodotto"} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.quantity * item.unitPriceCents)}</span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Totale Prodotti</span>
                  <span>{formatCurrency(calculateProductsTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Cliente</span>
            </div>
            <p className="font-medium">{getSelectedCustomerName() || "-"}</p>
            {useTemporaryCustomer && (
              <>
                {temporaryCustomerEmail && <p className="text-sm text-muted-foreground">{temporaryCustomerEmail}</p>}
                {temporaryCustomerPhone && <p className="text-sm text-muted-foreground">{temporaryCustomerPhone}</p>}
                <Badge variant="outline" className="mt-1">Temporaneo</Badge>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-2">
              <Euro className="h-4 w-4" />
              <span className="text-sm font-medium">Prezzo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {selectedPriceType === "mensile" ? "Mensile" : 
                   selectedPriceType === "forfait" ? "Forfait" : "Solo Attivazione"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Importo</p>
                <p className="font-medium text-lg">
                  {selectedPriceType === "mensile" 
                    ? `${monthlyPrice || "0"}€/mese`
                    : selectedPriceType === "forfait"
                    ? `${flatPrice || "0"}€`
                    : `${activationPrice || "0"}€ (una tantum)`}
                </p>
              </div>
              {commission && (
                <div>
                  <p className="text-xs text-muted-foreground">Commissione</p>
                  <p className="font-medium">{commission}€</p>
                </div>
              )}
              {supplierReference && (
                <div>
                  <p className="text-xs text-muted-foreground">Rif. Fornitore</p>
                  <p className="font-medium">{supplierReference}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Note</p>
              <p className="text-sm">{notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "type":
        return renderTypeStep();
      case "service":
        return renderServiceStep();
      case "customer":
        return renderCustomerStep();
      case "pricing":
        return renderPricingStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuova Pratica Utility</DialogTitle>
          <DialogDescription>
            Segui i passaggi per creare una nuova pratica
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto px-1">
          {renderCurrentStep()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStep === "type"}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>

          {currentStep === "review" ? (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-create"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Crea Pratica
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              data-testid="button-next"
            >
              Avanti
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
