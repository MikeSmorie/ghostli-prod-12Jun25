import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";

interface DirectPurchaseButtonProps {
  amount: string;
  creditAmount: number;
  onSuccess?: () => void;
}

export default function DirectPurchaseButton({ amount, creditAmount, onSuccess }: DirectPurchaseButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Making purchase request with:', {
        amount: parseFloat(amount),
        creditAmount: creditAmount,
        token: token.substring(0, 20) + '...'
      });

      const response = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          creditAmount: creditAmount
        })
      });

      console.log('Purchase response status:', response.status);
      console.log('Purchase response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Purchase error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Purchase Successful!",
          description: `Added ${result.creditsAdded} credits to your account`,
        });
        
        if (onSuccess) onSuccess();
        
        // Refresh the page to update credit display
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Unable to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handlePurchase}
      disabled={isProcessing}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Complete ${amount} Purchase
        </>
      )}
    </Button>
  );
}