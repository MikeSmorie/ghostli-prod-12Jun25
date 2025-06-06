// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

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
  intent: string;
}

// Global PayPal state management
declare global {
  interface Window {
    paypalInitialized?: boolean;
    paypalInstance?: any;
  }
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const currentClickHandlerRef = React.useRef<((event: Event) => void) | null>(null);

  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

  const handlePayPalClick = React.useCallback(async (event: Event) => {
    event.preventDefault();
    if (!window.paypalInstance) {
      console.error("PayPal instance not available");
      return;
    }
    
    try {
      const checkoutOptionsPromise = createOrder();
      await window.paypalInstance.start(
        { paymentFlow: "auto" },
        checkoutOptionsPromise,
      );
    } catch (e) {
      console.error("PayPal click error:", e);
    }
  }, [amount, currency, intent]);

  const setupPayPalButton = React.useCallback(() => {
    const paypalButton = document.getElementById("paypal-button");
    if (paypalButton && window.paypalInstance) {
      // Remove existing listener
      if (currentClickHandlerRef.current) {
        paypalButton.removeEventListener("click", currentClickHandlerRef.current);
      }
      
      // Add new listener
      currentClickHandlerRef.current = handlePayPalClick;
      paypalButton.addEventListener("click", currentClickHandlerRef.current);
    }
  }, [handlePayPalClick]);

  useEffect(() => {
    let isComponentMounted = true;

    const loadPayPalSDK = async () => {
      try {
        // Prevent multiple initializations
        if (window.paypalInitialized) {
          if (isComponentMounted) {
            setupPayPalButton();
          }
          return;
        }

        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => {
            if (isComponentMounted) {
              window.paypalInitialized = true;
              initPayPal();
            }
          };
          document.body.appendChild(script);
        } else {
          if (isComponentMounted) {
            window.paypalInitialized = true;
            initPayPal();
          }
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();

    return () => {
      isComponentMounted = false;
      // Clean up button event listener
      const button = document.getElementById("paypal-button");
      if (button && currentClickHandlerRef.current) {
        button.removeEventListener("click", currentClickHandlerRef.current);
      }
    };
  }, [amount, currency, intent]);

  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/api/paypal/setup")
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });

      // Store the PayPal instance globally to reuse
      if (!window.paypalInstance) {
        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        window.paypalInstance = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel,
          onError,
        });
      }

      // Set up the button click handler
      setupPayPalButton();
    } catch (e) {
      console.error("PayPal init error:", e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>