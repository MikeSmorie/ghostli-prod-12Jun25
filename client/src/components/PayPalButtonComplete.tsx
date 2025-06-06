import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonCompleteProps {
  amount: string;
  currency: string;
  onSuccess?: () => void;
}

export default function PayPalButtonComplete({ amount, currency, onSuccess }: PayPalButtonCompleteProps) {
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
      script.src = `https://www.paypal.com/sdk/js?client-id=AUyXKULe2bIRr39zNJVO4yiLXy4oXJF4dqIiK0i3iCAPfj2gkgoqVadRxDah-ctX-jr_Xpd2a-WBevLf&currency=${currency}&intent=capture&disable-funding=credit,card`;
      script.async = true;
      
      script.onload = () => {
        setIsLoaded(true);
        renderButton();
      };
      
      script.onerror = () => {
        toast({
          title: "PayPal Error",
          description: "Failed to load PayPal SDK",
          variant: "destructive"
        });
      };
      
      document.head.appendChild(script);
    };

    const renderButton = () => {
      if (!window.paypal || !paypalRef.current) return;

      paypalRef.current.innerHTML = "";

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 40
        },

        createOrder: async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/paypal/order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              },
              credentials: "include",
              body: JSON.stringify({
                amount: amount,
                currency: currency,
                intent: "CAPTURE"
              })
            });

            if (!response.ok) {
              throw new Error(`Failed to create order: ${response.status}`);
            }

            const data = await response.json();
            console.log('PayPal order created:', data);
            return data.id;
          } catch (error) {
            console.error('Order creation error:', error);
            toast({
              title: "Payment Error",
              description: "Failed to create payment order",
              variant: "destructive"
            });
            throw error;
          }
        },

        onApprove: async (data: any) => {
          try {
            console.log('PayPal approval received:', data);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/paypal/capture/${data.orderID}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              },
              credentials: "include",
              body: JSON.stringify({
                orderID: data.orderID,
                payerID: data.payerID
              })
            });

            const result = await response.json();
            console.log('Capture result:', result);

            if (response.ok && result.success) {
              toast({
                title: "Payment Successful",
                description: `Added ${result.creditsAdded} credits to your account`,
              });
              
              if (onSuccess) onSuccess();
              
              // Delay reload to show success message
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              throw new Error(result.error || 'Payment capture failed');
            }
          } catch (error) {
            console.error('Payment approval error:', error);
            toast({
              title: "Payment Error",
              description: error instanceof Error ? error.message : "Payment processing failed",
              variant: "destructive"
            });
          }
        },

        onError: (err: any) => {
          console.error('PayPal button error:', err);
          toast({
            title: "PayPal Error",
            description: "Payment could not be processed",
            variant: "destructive"
          });
        },

        onCancel: () => {
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment",
          });
        }
      }).render(paypalRef.current);
    };

    loadPayPal();
  }, [amount, currency]);

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full min-h-[40px]"></div>
    </div>
  );
}