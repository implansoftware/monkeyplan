import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CreditCard, ShieldCheck, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StripeB2BCheckoutProps {
  items?: { productId: string; quantity: number }[];
  shippingMethodId?: string | null;
  notes?: string;
  totalAmount?: number;
  orderData?: any;
  onSuccess: (order?: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  paymentIntentEndpoint?: string;
  createOrderEndpoint?: string;
  returnUrl?: string;
  sellerResellerId?: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
}

function CheckoutForm({ 
  onSuccess, 
  onError,
  onClose,
  totalAmount,
  items,
  shippingMethodId,
  notes,
  orderData: externalOrderData,
  createOrderEndpoint,
  returnUrl,
  sellerResellerId
}: { 
  onSuccess: (order?: any) => void; 
  onError: (error: string) => void;
  onClose: () => void;
  totalAmount?: number;
  items?: { productId: string; quantity: number }[];
  shippingMethodId?: string | null;
  notes?: string;
  orderData?: any;
  createOrderEndpoint: string;
  returnUrl: string;
  sellerResellerId?: string;
}) {
  const { t } = useTranslation();
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
          return_url: window.location.origin + returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || t("payment.paymentError"));
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Use external orderData if provided, otherwise build from items
        let orderData: any;
        if (externalOrderData) {
          orderData = {
            ...externalOrderData,
            paymentMethod: "card",
            stripePaymentIntentId: paymentIntent.id,
          };
        } else {
          orderData = {
            items,
            shippingMethodId,
            paymentMethod: "stripe",
            stripePaymentIntentId: paymentIntent.id,
          };
          
          if (sellerResellerId) {
            orderData.sellerResellerId = sellerResellerId;
            orderData.buyerNotes = notes;
          } else {
            orderData.notes = notes;
          }
        }
        
        const response = await apiRequest("POST", createOrderEndpoint, orderData);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || t("payment.orderCreationError"));
        }

        const order = await response.json();
        onSuccess(order);
      }
    } catch (err: any) {
      onError(err.message || t("payment.paymentError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground">Totale da pagare</p>
        <p className="text-3xl font-bold">{formatPrice(totalAmount ?? 0)}</p>
      </div>
      
      <div className="py-2">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>{t("payment.securePayment")}</span>
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button 
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-stripe-cancel"
        >
          {t("common.cancel")}
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
              Paga Ora
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
  totalAmount,
  orderData,
  onSuccess, 
  onError,
  disabled,
  paymentIntentEndpoint = "/api/reseller/b2b-orders/stripe-payment-intent",
  createOrderEndpoint = "/api/reseller/b2b-orders",
  returnUrl = "/reseller/b2b-orders",
  sellerResellerId
}: StripeB2BCheckoutProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const initStripe = async () => {
    try {
      setIsLoading(true);
      setInitError(null);
      
      const requestBody: any = { shippingMethodId };
      if (items && items.length > 0) {
        requestBody.items = items;
      }
      if (sellerResellerId) {
        requestBody.sellerResellerId = sellerResellerId;
      }
      if (orderData) {
        requestBody.orderData = orderData;
      }
      if (totalAmount !== undefined) {
        requestBody.totalAmount = totalAmount;
      }

      const response = await apiRequest("POST", paymentIntentEndpoint, requestBody);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || t("payment.paymentInitError"));
      }

      const data: PaymentIntentResponse = await response.json();
      
      setStripePromise(loadStripe(data.publishableKey));
      setClientSecret(data.clientSecret);
      setIsOpen(true);
    } catch (err: any) {
      setInitError(err.message || t("payment.stripeLoadError"));
      onError(err.message || t("payment.stripeLoadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    if (!stripePromise || !clientSecret) {
      initStripe();
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = (order?: any) => {
    setIsOpen(false);
    setClientSecret(null);
    setStripePromise(null);
    onSuccess(order);
  };

  if (disabled) {
    return null;
  }

  return (
    <>
      <Button 
        onClick={handleOpen}
        disabled={isLoading || (items && items.length === 0 && !orderData && !totalAmount)}
        className="w-full"
        data-testid="button-stripe-open"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparazione pagamento...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Paga con Carta di Credito
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento con Carta
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati della tua carta per completare l'ordine
            </DialogDescription>
          </DialogHeader>
          
          {stripePromise && clientSecret ? (
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
                onSuccess={handleSuccess}
                onError={onError}
                onClose={handleClose}
                totalAmount={totalAmount}
                items={items}
                shippingMethodId={shippingMethodId}
                notes={notes}
                orderData={orderData}
                createOrderEndpoint={createOrderEndpoint}
                returnUrl={returnUrl}
                sellerResellerId={sellerResellerId}
              />
            </Elements>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
