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

export default function ResellerPosRegisterSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<string>("cash");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>(["cash"]);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);

  const { data: register, isLoading } = useQuery<PosRegister>({
    queryKey: ["/api/reseller/pos/registers", id],
    enabled: !!id,
  });

  const { data: paymentConfigResponse } = useQuery<PaymentConfigResponse>({
    queryKey: ["/api/reseller/payment-config"],
  });
  
  const effectivePaymentConfig = paymentConfigResponse?.effectiveConfig;

  useEffect(() => {
    if (register) {
      setDefaultPaymentMethod(register.defaultPaymentMethod || "cash");
      
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
      return apiRequest("PATCH", `/api/reseller/pos/registers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/registers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/registers", id] });
      toast({ title: "Impostazioni salvate", description: "Le impostazioni della cassa sono state aggiornate" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore nel salvataggio", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      defaultPaymentMethod,
      enabledPaymentMethods,
      autoPrintReceipt,
    });
  };

  const togglePaymentMethod = (method: string) => {
    if (method === "cash") return;
    setEnabledPaymentMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const isMethodAvailable = (method: typeof PAYMENT_METHODS[number]) => {
    if (method.alwaysEnabled) return true;
    if (!method.requiresConfig) return true;
    if (!effectivePaymentConfig) return true;
    return (effectivePaymentConfig as any)[method.requiresConfig] === true;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!register) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground" data-testid="text-register-not-found">Cassa non trovata</p>
            <Link href="/reseller/pos/registers">
              <Button variant="outline" className="mt-4" data-testid="button-back-to-registers">
                Torna alle casse
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reseller/pos/registers">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-settings-title">
            <Settings className="h-6 w-6" />
            Impostazioni Cassa
          </h1>
          <p className="text-muted-foreground" data-testid="text-register-name">{register.name}</p>
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
              Seleziona i metodi di pagamento abilitati per questa cassa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {PAYMENT_METHODS.map(method => {
                const available = isMethodAvailable(method);
                return (
                  <div key={method.value} className="flex items-center gap-3">
                    <Checkbox
                      id={`method-${method.value}`}
                      checked={enabledPaymentMethods.includes(method.value)}
                      onCheckedChange={() => togglePaymentMethod(method.value)}
                      disabled={method.alwaysEnabled || !available}
                      data-testid={`checkbox-method-${method.value}`}
                    />
                    <Label 
                      htmlFor={`method-${method.value}`}
                      className={!available ? "text-muted-foreground line-through" : ""}
                    >
                      {method.label}
                      {!available && " (non configurato)"}
                      {method.alwaysEnabled && " (sempre attivo)"}
                    </Label>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="default-method">Metodo di pagamento predefinito</Label>
              <Select value={defaultPaymentMethod} onValueChange={setDefaultPaymentMethod}>
                <SelectTrigger className="mt-2" data-testid="select-default-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.filter(m => enabledPaymentMethods.includes(m.value)).map(m => (
                    <SelectItem key={m.value} value={m.value} data-testid={`option-default-${m.value}`}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Stampa
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
          <Link href="/reseller/pos/registers">
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
