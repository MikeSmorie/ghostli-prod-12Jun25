import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonSimpleProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButtonSimple({
  amount,
  currency,
  intent,
}: PayPalButtonSimpleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const { toast } = useToast();
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load PayPal SDK
    const loadPayPalScript = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
        renderPayPalButton();
        return;
      }

      const script = document.createElement('script');
      // Use the same PayPal Client ID as the server
      const clientId = 'AUyXKULe2bIRr39zNJVO4yiLXy4oXJF4dqIiK0i3iCAPfj2gkgoqVadRxDah-ctX-jr_Xpd2a-WBevLf';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
        renderPayPalButton();
      };
      script.onerror = () => {
        toast({
          title: "PayPal Error",
          description: "Failed to load PayPal. Please try again.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [amount, currency]);

  const renderPayPalButton = () => {
    if (!window.paypal || !paypalRef.current) return;

    // Clear existing buttons
    paypalRef.current.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        try {
          const response = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: amount,
              currency: currency,
              intent: intent,
            }),
          });
          
          if (!response.ok) {
            throw new Error("Failed to create PayPal order");
          }
          
          const orderData = await response.json();
          return orderData.id;
        } catch (error) {
          toast({
            title: "Payment Error",
            description: "Failed to create payment order. Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      },

      onApprove: async (data: any) => {
        setIsProcessing(true);
        try {
          const response = await fetch(`/api/paypal/capture/${data.orderID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            throw new Error("Failed to capture payment");
          }
          
          const captureData = await response.json();
          
          toast({
            title: "Payment Successful",
            description: "Your credits have been added to your account.",
            variant: "default",
          });
          
          // Refresh page to update credits
          window.location.reload();
        } catch (error) {
          toast({
            title: "Payment Error", 
            description: "Payment was approved but capture failed. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },

      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast({
          title: "Payment Error",
          description: "PayPal payment failed. Please try again or use a different payment method.",
          variant: "destructive",
        });
        setIsProcessing(false);
      },

      onCancel: () => {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the PayPal payment.",
          variant: "default",
        });
        setIsProcessing(false);
      },

      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal'
      }
    }).render(paypalRef.current);
  };

  const handleFallbackPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Create order
      const orderResponse = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          intent: intent,
        }),
      });
      
      if (!orderResponse.ok) {
        throw new Error("Failed to create PayPal order");
      }
      
      const orderData = await orderResponse.json();
      
      // Redirect to PayPal for approval
      if (orderData.links) {
        const approvalUrl = orderData.links.find((link: any) => link.rel === "approve")?.href;
        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          throw new Error("No approval URL found");
        }
      } else {
        throw new Error("Invalid PayPal order response");
      }
      
    } catch (error) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate PayPal payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      {paypalLoaded ? (
        <div>
          {/* PayPal SDK Button for better session handling */}
          <div ref={paypalRef} className="w-full min-h-[50px]"></div>
          
          {/* Fallback button if SDK fails */}
          <div className="mt-2">
            <Button
              onClick={handleFallbackPayment}
              disabled={isProcessing}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
              variant="outline"
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Alternative PayPal Login
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleFallbackPayment}
          disabled={isProcessing}
          className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading PayPal...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay with PayPal
            </>
          )}
        </Button>
      )}
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        {paypalLoaded ? 
          "Use the PayPal button above or the alternative login below" : 
          "Loading PayPal payment options..."
        }
      </div>
    </div>
  );
}