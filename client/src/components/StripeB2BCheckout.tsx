import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StripeB2BCheckoutProps {
  items: { productId: string; quantity: number }[];
  shippingMethodId: string;
  notes: string;
  onSuccess: () => void;
  onError: (error: string) => void;
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
  onError 
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
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
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
            Paga con Carta
          </>
        )}
      </Button>
    </form>
  );
}

export function StripeB2BCheckout({ 
  items, 
  shippingMethodId, 
  notes, 
  onSuccess, 
  onError,
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
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Caricamento pagamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive text-sm">
        {error}
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
          theme: 'stripe',
          variables: {
            colorPrimary: '#0066cc',
          },
        },
      }}
    >
      <CheckoutForm 
        items={items}
        shippingMethodId={shippingMethodId}
        notes={notes}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
