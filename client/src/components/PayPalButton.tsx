// PayPal Checkout Button Component for B2B Orders
// Based on Replit PayPal Blueprint

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  onSuccess: (paypalOrderId: string, captureData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function PayPalButton({
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalCheckoutRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createOrder = useCallback(async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: "CAPTURE",
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Errore creazione ordine PayPal");
    }
    const output = await response.json();
    return { orderId: output.id };
  }, [amount, currency]);

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Errore cattura pagamento PayPal");
    }
    const data = await response.json();
    return data;
  };

  const onApprove = useCallback(async (data: any) => {
    try {
      setIsProcessing(true);
      const orderData = await captureOrder(data.orderId);
      onSuccess(data.orderId, orderData);
    } catch (error: any) {
      onError(error.message || "Errore durante il pagamento");
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleError = useCallback((data: any) => {
    onError(data?.message || "Errore PayPal");
  }, [onError]);

  // Initialize PayPal SDK
  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = "https://www.sandbox.paypal.com/web-sdk/v6/core"; // Use Sandbox SDK for testing
          script.async = true;
          script.onload = () => initPayPal();
          script.onerror = () => {
            setIsLoading(false);
            onError("Impossibile caricare PayPal SDK");
          };
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
        setIsLoading(false);
        onError("Errore caricamento PayPal SDK");
      }
    };

    const initPayPal = async () => {
      try {
        const clientToken: string = await fetch("/paypal/setup")
          .then((res) => {
            if (!res.ok) throw new Error("PayPal non configurato");
            return res.json();
          })
          .then((data) => {
            return data.clientToken;
          });

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel: handleCancel,
          onError: handleError,
        });

        // Store the checkout instance in ref for later use
        paypalCheckoutRef.current = paypalCheckout;

        setSdkReady(true);
        setIsLoading(false);
      } catch (e: any) {
        console.error(e);
        setIsLoading(false);
        onError(e.message || "Errore inizializzazione PayPal");
      }
    };

    loadPayPalSDK();
  }, [onApprove, handleCancel, handleError, onError]);

  // Handle button click
  const handleClick = useCallback(async () => {
    if (!paypalCheckoutRef.current || disabled || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const checkoutOptionsPromise = createOrder();
      await paypalCheckoutRef.current.start(
        { paymentFlow: "auto" },
        checkoutOptionsPromise,
      );
    } catch (e: any) {
      console.error(e);
      onError(e.message || "Errore checkout PayPal");
      setIsProcessing(false);
    }
  }, [createOrder, disabled, isProcessing, onError]);

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Caricamento PayPal...
      </Button>
    );
  }

  if (!sdkReady) {
    return (
      <Button disabled variant="destructive" className="w-full">
        PayPal non disponibile
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className="w-full bg-[#0070ba] hover:bg-[#003087] text-white"
      data-testid="button-paypal-checkout"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Elaborazione...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h6.012c2.657 0 4.543.548 5.608 1.628.967.981 1.336 2.343 1.097 4.048-.03.216-.067.442-.113.677l-.002.012c-.586 3.308-2.625 4.988-6.065 4.988H9.49a.641.641 0 0 0-.632.541l-.844 5.337a.641.641 0 0 1-.632.54h-.307v.386zm.793-7.506h1.753c2.495 0 3.858-1.212 4.29-3.817.193-1.161-.039-2.017-.688-2.542-.716-.578-1.904-.873-3.533-.873H7.628l-1.27 7.232h1.51z"/>
          </svg>
          Paga con PayPal ({currency} {amount})
        </>
      )}
    </Button>
  );
}
