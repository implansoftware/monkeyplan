import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StripeB2BCheckoutProps {
  items: { productId: string; quantity: number }[];
  shippingMethodId: string;
  notes: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
}

function CheckoutForm({ 
  items, 
  shippingMethodId, 
  notes, 
  onSuccess, 
  onError,
  onCancel
}: Omit<StripeB2BCheckoutProps, 'disabled'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/reseller/b2b-orders",
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Errore nel pagamento");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const response = await apiRequest("POST", "/api/reseller/b2b-orders", {
          items,
          shippingMethodId,
          notes,
          paymentMethod: "stripe",
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Errore nella creazione dell'ordine");
        }

        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || "Errore nel pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Pagamento sicuro con crittografia SSL</span>
      </div>
      
      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-stripe-cancel"
        >
          Annulla
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-stripe-pay"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Paga e Invia Ordine
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripeB2BCheckout({ 
  items, 
  shippingMethodId, 
  notes, 
  onSuccess, 
  onError,
  onCancel,
  disabled 
}: StripeB2BCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled || items.length === 0) {
      setIsLoading(false);
      return;
    }

    const initStripe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiRequest("POST", "/api/reseller/b2b-orders/stripe-payment-intent", {
          items,
          shippingMethodId,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Errore inizializzazione pagamento");
        }

        const data: PaymentIntentResponse = await response.json();
        
        setStripePromise(loadStripe(data.publishableKey));
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Errore caricamento Stripe");
        onError(err.message || "Errore caricamento Stripe");
      } finally {
        setIsLoading(false);
      }
    };

    initStripe();
  }, [items, shippingMethodId, disabled]);

  if (disabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Preparazione pagamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
        <Button variant="outline" onClick={onCancel}>
          Torna indietro
        </Button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return null;
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: 'hsl(222.2 47.4% 11.2%)',
            colorBackground: 'hsl(0 0% 100%)',
            colorText: 'hsl(222.2 47.4% 11.2%)',
            colorDanger: 'hsl(0 84.2% 60.2%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '6px',
            fontSizeBase: '14px',
          },
          rules: {
            '.Input': {
              border: '1px solid hsl(214.3 31.8% 91.4%)',
              boxShadow: 'none',
              padding: '10px 12px',
            },
            '.Input:focus': {
              border: '1px solid hsl(222.2 47.4% 11.2%)',
              boxShadow: '0 0 0 1px hsl(222.2 47.4% 11.2%)',
            },
            '.Label': {
              fontWeight: '500',
              fontSize: '14px',
              marginBottom: '6px',
            },
            '.Tab': {
              border: '1px solid hsl(214.3 31.8% 91.4%)',
              borderRadius: '6px',
            },
            '.Tab--selected': {
              backgroundColor: 'hsl(222.2 47.4% 11.2%)',
              color: 'white',
            },
          },
        },
        locale: 'it',
      }}
    >
      <CheckoutForm 
        items={items}
        shippingMethodId={shippingMethodId}
        notes={notes}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}
