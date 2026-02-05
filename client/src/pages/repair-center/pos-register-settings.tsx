import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Settings,
  CreditCard,
  Printer,
  Save,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PosRegister {
  id: string;
  repairCenterId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  defaultPaymentMethod: string | null;
  enabledPaymentMethods: string[] | null;
  autoPrintReceipt: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentConfigItem {
  bankTransferEnabled?: boolean;
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
  satispayEnabled?: boolean;
}

interface PaymentConfigResponse {
  ownConfig: PaymentConfigItem | null;
  parentConfig: PaymentConfigItem | null;
  effectiveConfig: PaymentConfigItem | null;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Contanti", alwaysEnabled: true },
  { value: "card", label: "Carta (POS fisico)" },
  { value: "stripe_link", label: "Stripe Payment Link", requiresConfig: "stripeEnabled" },
  { value: "paypal", label: "PayPal", requiresConfig: "paypalEnabled" },
  { value: "pos_terminal", label: "Terminale POS" },
  { value: "mixed", label: "Pagamento Misto" },
];

export default function PosRegisterSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<string>("cash");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>(["cash"]);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);

  const { data: register, isLoading } = useQuery<PosRegister>({
    queryKey: ["/api/repair-center/pos/registers", id],
    enabled: !!id,
  });

  const { data: paymentConfigResponse } = useQuery<PaymentConfigResponse>({
    queryKey: ["/api/repair-center/payment-config"],
  });
  
  const effectivePaymentConfig = paymentConfigResponse?.effectiveConfig;

  useEffect(() => {
    if (register) {
      setDefaultPaymentMethod(register.defaultPaymentMethod || "cash");
      
      // Se la cassa ha già metodi salvati, usare quelli
      // Altrimenti, preselezionare i metodi configurati dal reseller/repair center
      if (register.enabledPaymentMethods && register.enabledPaymentMethods.length > 0) {
        setEnabledPaymentMethods(register.enabledPaymentMethods);
      } else if (effectivePaymentConfig) {
        const defaultMethods: string[] = ["cash"];
        if (effectivePaymentConfig.stripeEnabled) {
          defaultMethods.push("stripe_link");
        }
        if (effectivePaymentConfig.paypalEnabled) {
          defaultMethods.push("paypal");
        }
        setEnabledPaymentMethods(defaultMethods);
      } else {
        setEnabledPaymentMethods(["cash"]);
      }
      
      setAutoPrintReceipt(register.autoPrintReceipt);
    }
  }, [register, effectivePaymentConfig]);

  const updateMutation = useMutation({
    mutationFn: async (data: { defaultPaymentMethod: string; enabledPaymentMethods: string[]; autoPrintReceipt: boolean }) => {
      return apiRequest("PATCH", `/api/repair-center/pos/registers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/registers"] });
      toast({ title: "Impostazioni salvate", description: "Le impostazioni della cassa sono state aggiornate" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!enabledPaymentMethods.includes(defaultPaymentMethod)) {
      toast({ 
        title: "Errore", 
        description: "Il metodo di pagamento predefinito deve essere tra i metodi abilitati", 
        variant: "destructive" 
      });
      return;
    }
    updateMutation.mutate({ defaultPaymentMethod, enabledPaymentMethods, autoPrintReceipt });
  };

  const togglePaymentMethod = (method: string, checked: boolean) => {
    if (method === "cash") return;
    
    if (checked) {
      setEnabledPaymentMethods([...enabledPaymentMethods, method]);
    } else {
      const newMethods = enabledPaymentMethods.filter(m => m !== method);
      setEnabledPaymentMethods(newMethods);
      if (defaultPaymentMethod === method) {
        setDefaultPaymentMethod("cash");
      }
    }
  };

  const isMethodConfigured = (method: typeof PAYMENT_METHODS[0]): boolean => {
    if (method.alwaysEnabled) return true;
    if (!method.requiresConfig) return true;
    if (!effectivePaymentConfig) return false;
    return effectivePaymentConfig[method.requiresConfig as keyof PaymentConfigItem] === true;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!register) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cassa non trovata</p>
          <Link href="/repair-center/pos/registers">
            <Button variant="ghost" className="mt-4" data-testid="link-back-registers">
              Torna alle casse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/repair-center/pos/registers">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Impostazioni Cassa</h1>
          <p className="text-muted-foreground">{register.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Metodi di Pagamento
            </CardTitle>
            <CardDescription>
              Configura i metodi di pagamento disponibili per questa cassa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Metodo di Pagamento Predefinito</Label>
              <Select value={defaultPaymentMethod} onValueChange={setDefaultPaymentMethod}>
                <SelectTrigger data-testid="select-default-payment">
                  <SelectValue placeholder="Seleziona metodo predefinito" />
                </SelectTrigger>
                <SelectContent>
                  {enabledPaymentMethods.map(method => {
                    const paymentMethod = PAYMENT_METHODS.find(m => m.value === method);
                    return paymentMethod ? (
                      <SelectItem key={method} value={method}>
                        {paymentMethod.label}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Questo metodo verrà selezionato automaticamente per le nuove transazioni
              </p>
            </div>

            <div className="space-y-3">
              <Label>Metodi Abilitati</Label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => {
                  const isConfigured = isMethodConfigured(method);
                  const isChecked = enabledPaymentMethods.includes(method.value);
                  
                  return (
                    <div 
                      key={method.value} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${!isConfigured ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`method-${method.value}`}
                          checked={isChecked}
                          disabled={method.alwaysEnabled || !isConfigured}
                          onCheckedChange={(checked) => togglePaymentMethod(method.value, checked as boolean)}
                          data-testid={`checkbox-method-${method.value}`}
                        />
                        <Label 
                          htmlFor={`method-${method.value}`} 
                          className={`cursor-pointer ${method.alwaysEnabled ? 'font-medium' : ''}`}
                        >
                          {method.label}
                          {method.alwaysEnabled && (
                            <span className="text-xs text-muted-foreground ml-2">(sempre attivo)</span>
                          )}
                          {!isConfigured && method.requiresConfig && (
                            <span className="text-xs text-amber-600 ml-2">(non configurato)</span>
                          )}
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Stampa Automatica
            </CardTitle>
            <CardDescription>
              Configura le opzioni di stampa per questa cassa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-print">Stampa automatica scontrino</Label>
                <p className="text-sm text-muted-foreground">
                  Stampa automaticamente lo scontrino dopo ogni transazione completata
                </p>
              </div>
              <Switch
                id="auto-print"
                checked={autoPrintReceipt}
                onCheckedChange={setAutoPrintReceipt}
                data-testid="switch-auto-print"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/repair-center/pos/registers">
            <Button variant="outline" data-testid="button-cancel">
              Annulla
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Impostazioni
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
