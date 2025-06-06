import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentTestButtonProps {
  amount: string;
  creditAmount: number;
  onSuccess?: () => void;
}

export default function PaymentTestButton({
  amount,
  creditAmount,
  onSuccess,
}: PaymentTestButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTestPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await apiRequest("POST", "/api/payment-test/test-complete", {
        amount: amount,
        paymentMethod: "TEST_COMPLETION"
      });

      if (!response.ok) {
        throw new Error("Payment completion failed");
      }

      const result = await response.json();
      
      toast({
        title: "Payment Completed",
        description: `Successfully added ${result.creditsAdded} credits to your account.`,
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh page to update credits
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to complete payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleTestPayment}
      disabled={isProcessing}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing Payment...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Payment ({creditAmount} credits)
        </>
      )}
    </Button>
  );
}