import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StripeB2BCheckoutProps {
  items: { productId: string; quantity: number }[];
  shippingMethodId: string;
  notes: string;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function StripeB2BCheckout({ 
  items, 
  shippingMethodId, 
  notes, 
  onError,
  disabled 
}: StripeB2BCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || items.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/reseller/b2b-orders/stripe-checkout", {
        items,
        shippingMethodId,
        notes,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Errore inizializzazione pagamento");
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("URL checkout non ricevuto");
      }
    } catch (err: any) {
      onError(err.message || "Errore caricamento Stripe");
      setIsLoading(false);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <Button 
      onClick={handleCheckout}
      disabled={isLoading || items.length === 0}
      className="w-full"
      data-testid="button-stripe-checkout"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reindirizzamento a Stripe...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Paga con Carta di Credito
        </>
      )}
    </Button>
  );
}
