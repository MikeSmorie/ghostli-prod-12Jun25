import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
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
    <Button
      onClick={handlePayPalPayment}
      disabled={isProcessing}
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay with PayPal
        </>
      )}
    </Button>
  );
}