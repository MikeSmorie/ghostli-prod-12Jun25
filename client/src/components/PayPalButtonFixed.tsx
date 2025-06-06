import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonFixedProps {
  amount: string;
  currency: string;
  onSuccess?: () => void;
}

export default function PayPalButtonFixed({ amount, currency, onSuccess }: PayPalButtonFixedProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPayPal = async () => {
      if (window.paypal) {
        renderButton();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=AUyXKULe2bIRr39zNJVO4yiLXy4oXJF4dqIiK0i3iCAPfj2gkgoqVadRxDah-ctX-jr_Xpd2a-WBevLf&currency=${currency}&intent=capture&vault=false&commit=true`;
      script.async = true;
      
      script.onload = () => {
        setIsLoaded(true);
        renderButton();
      };
      
      document.head.appendChild(script);
    };

    const renderButton = () => {
      if (!window.paypal || !paypalRef.current) return;

      paypalRef.current.innerHTML = "";

      window.paypal.Buttons({
        createOrder: async () => {
          const response = await fetch("/api/paypal/order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              amount: amount,
              currency: currency,
              intent: "CAPTURE"
            })
          });

          const data = await response.json();
          return data.id;
        },

        onApprove: async (data: any) => {
          try {
            console.log('PayPal approval data:', data);
            
            const response = await fetch(`/api/paypal/capture/${data.orderID}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                orderID: data.orderID,
                payerID: data.payerID
              })
            });

            const result = await response.json();
            console.log('Capture response:', result);

            if (response.ok && result.success) {
              toast({
                title: "Payment Successful",
                description: `Successfully added ${result.creditsAdded || 100} credits to your account`,
              });
              
              if (onSuccess) onSuccess();
              setTimeout(() => window.location.reload(), 2000);
            } else {
              throw new Error(result.error || 'Payment capture failed');
            }
          } catch (error) {
            console.error('PayPal approval error:', error);
            toast({
              title: "Payment Error",
              description: error instanceof Error ? error.message : "Payment processing failed",
              variant: "destructive"
            });
          }
        },

        onError: () => {
          toast({
            title: "PayPal Error",
            description: "Payment could not be processed",
            variant: "destructive"
          });
        }
      }).render(paypalRef.current);
    };

    loadPayPal();
  }, [amount, currency]);

  return <div ref={paypalRef} className="w-full"></div>;
}