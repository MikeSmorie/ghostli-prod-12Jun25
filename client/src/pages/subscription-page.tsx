import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import PayPalButton from "@/components/PayPalButton";
import CryptoPayment from "@/components/crypto/CryptoPayment";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Sparkles,
  X,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Receipt,
  ArrowRight,
  Zap,
  Bitcoin,
  Coins,
} from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string;
  isActive: boolean;
  trialPeriodDays: number | null;
  position: number;
}

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string | null;
  cancelledAt: string | null;
  plan: SubscriptionPlan;
}

interface Payment {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const SubscriptionPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.id;
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [paymentStep, setPaymentStep] = useState<"select" | "checkout" | "confirmation">("select");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto">("paypal");
  const [cryptoRates, setCryptoRates] = useState({
    bitcoin: 0,
    solana: 0,
    usdt: 1 // USDT is pegged to USD
  });

  // Fetch subscription plans
  const {
    data: plans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription/plans");
      return response.json();
    },
    enabled: paymentStep === "select",
  });

  // Fetch user's current subscription
  const {
    data: userSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useQuery<UserSubscription>({
    queryKey: ["/api/subscription/user", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/subscription/user/${userId}`);
      if (response.status === 404) {
        return null;
      }
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Fetch crypto exchange rates
  const {
    data: exchangeRates,
    isLoading: isLoadingRates,
  } = useQuery({
    queryKey: ["/api/crypto/exchange-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crypto/exchange-rates");
      const data = await response.json();
      
      // Update crypto rates in state
      const rates = {
        bitcoin: data.find((rate: any) => rate.cryptoType === "bitcoin")?.rateUsd || 0,
        solana: data.find((rate: any) => rate.cryptoType === "solana")?.rateUsd || 0,
        usdt: 1 // USDT is pegged to USD
      };
      setCryptoRates(rates);
      
      return data;
    },
    enabled: paymentStep === "checkout" && paymentMethod === "crypto",
  });

  // Fetch user's payment history
  const {
    data: paymentHistory,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = useQuery<Payment[]>({
    queryKey: ["/api/payment/history", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/payment/history/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Subscribe to a plan mutation
  const subscribeMutation = useMutation({
    mutationFn: async (variables: { userId: number; planId: number }) => {
      const response = await apiRequest("POST", "/api/subscription/subscribe", variables);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/user"] });
      toast({
        title: "Subscription initiated",
        description: "Please complete payment to activate your subscription.",
      });
      setPaymentStep("checkout");
    },
    onError: (error: any) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to initiate subscription",
        variant: "destructive",
      });
    },
  });
  
  // Track the loading state
  const isSubscribeMutationLoading = subscribeMutation.status === "pending";

  // Handle subscription cancellation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiRequest("POST", `/api/subscription/cancel/${subscriptionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/user"] });
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled and will expire at the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });
  
  // Track the loading state
  const isCancelMutationLoading = cancelSubscriptionMutation.status === "pending";

  // Initialize selected plan from user subscription
  useEffect(() => {
    if (userSubscription && userSubscription.planId) {
      setSelectedPlanId(userSubscription.planId);
    }
  }, [userSubscription]);

  // Reset payment flow if plan changes
  useEffect(() => {
    if (selectedPlanId) {
      setPaymentStep("select");
    }
  }, [selectedPlanId]);

  const handlePlanSelect = (planId: number) => {
    if (userSubscription && userSubscription.planId === planId) {
      toast({
        title: "Already subscribed",
        description: "You are already subscribed to this plan.",
      });
      return;
    }
    setSelectedPlanId(planId);
  };

  const handleInitiateSubscription = () => {
    if (!userId || !selectedPlanId) return;
    subscribeMutation.mutate({ userId, planId: selectedPlanId });
  };

  const handleCancelSubscription = () => {
    if (!userSubscription) return;
    cancelSubscriptionMutation.mutate(userSubscription.id);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setTransactionId(orderId);
    setPaymentStep("confirmation");
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/user"] });
    toast({
      title: "Payment successful",
      description: "Your subscription has been activated.",
    });
  };

  const handlePaymentFailure = () => {
    toast({
      title: "Payment failed",
      description: "There was an issue processing your payment. Please try again.",
      variant: "destructive",
    });
  };

  // Compute prices with discounts
  const getAdjustedPrice = (price: number): number => {
    if (billingCycle === "yearly") {
      // 20% discount for yearly billing
      return parseFloat((price * 0.8 * 12).toFixed(2));
    }
    return price;
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };
  
  // Calculate crypto price based on USD amount and crypto rate
  const calculateCryptoPrice = (usdAmount: number, cryptoType: string): string => {
    if (cryptoType === "bitcoin" && cryptoRates.bitcoin > 0) {
      return (usdAmount / cryptoRates.bitcoin).toFixed(8);
    } else if (cryptoType === "solana" && cryptoRates.solana > 0) {
      return (usdAmount / cryptoRates.solana).toFixed(6);
    } else if (cryptoType === "usdt") {
      return usdAmount.toFixed(2);
    }
    return "0.00";
  };
  
  // Handle crypto payment success
  const handleCryptoPaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/user"] });
    setPaymentStep("confirmation");
    toast({
      title: "Crypto payment successful",
      description: "Your subscription has been activated.",
    });
  };

  // Get subscription status label and color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Cancelled</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get selected plan details
  const selectedPlan = plans?.find((plan) => plan.id === selectedPlanId);

  // Generate payment amount based on selected plan and billing cycle
  const paymentAmount = selectedPlan 
    ? getAdjustedPrice(selectedPlan.price)
    : 0;

  // Check if a plan feature is included by searching for keywords
  const hasFeature = (plan: SubscriptionPlan, feature: string): boolean => {
    try {
      if (!plan.features) return false;
      const featuresList = typeof plan.features === 'string' 
        ? JSON.parse(plan.features) 
        : plan.features;
      
      if (Array.isArray(featuresList)) {
        return featuresList.some((f) => 
          typeof f === 'string' && f.toLowerCase().includes(feature.toLowerCase())
        );
      }
      return false;
    } catch (e) {
      console.error("Error parsing features:", e);
      return false;
    }
  };

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading subscription information...</p>
      </div>
    );
  }

  if (plansError || subscriptionError) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
        <h3 className="mt-4 text-xl font-semibold">Error Loading Subscription Data</h3>
        <p className="mt-2 text-muted-foreground">
          We encountered an issue while loading subscription information.
          Please try again later or contact support.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const sortedPlans = plans
    ? [...plans].sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
      <p className="text-muted-foreground mb-10">
        Choose the right plan for your content needs. Upgrade anytime to access premium features.
      </p>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="current">Current Subscription</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Subscription Plans Tab */}
        <TabsContent value="plans">
          {paymentStep === "select" && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold">Choose Your Plan</h2>
                <div className="flex items-center gap-4 bg-muted p-2 rounded-lg">
                  <div className={`px-3 py-1.5 rounded-md cursor-pointer ${billingCycle === "monthly" ? "bg-white dark:bg-gray-800 shadow" : ""}`} onClick={() => setBillingCycle("monthly")}>
                    Monthly
                  </div>
                  <div className={`px-3 py-1.5 rounded-md cursor-pointer ${billingCycle === "yearly" ? "bg-white dark:bg-gray-800 shadow" : ""}`} onClick={() => setBillingCycle("yearly")}>
                    Yearly <span className="text-xs font-medium text-green-500">Save 20%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative overflow-hidden transition-all ${
                      selectedPlanId === plan.id ? "border-primary ring-2 ring-primary ring-opacity-50" : ""
                    } ${plan.name.toLowerCase().includes("pro") ? "shadow-lg" : ""}`}
                  >
                    {plan.name.toLowerCase().includes("pro") && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 transform translate-x-[30%] translate-y-[40%] rotate-45">
                        POPULAR
                      </div>
                    )}
                    
                    <CardHeader className={`${plan.name.toLowerCase().includes("pro") ? "bg-primary/10" : ""}`}>
                      <CardTitle className="flex items-center">
                        {plan.name.toLowerCase().includes("pro") && (
                          <Crown className="h-5 w-5 mr-2 text-primary" />
                        )}
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      <div className="mb-6">
                        <span className="text-3xl font-bold">
                          {formatPrice(getAdjustedPrice(plan.price))}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {billingCycle === "yearly" ? "/year" : "/month"}
                        </span>
                        
                        {billingCycle === "yearly" && (
                          <div className="mt-1">
                            <Badge variant="outline" className="font-normal">
                              {formatPrice(plan.price)}/mo × 12 months (20% off)
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium">Features include:</h3>
                        <ul className="space-y-2">
                          {hasFeature(plan, "unlimited") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Unlimited content generation</span>
                            </li>
                          )}
                          {hasFeature(plan, "cloning") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Writing style cloning</span>
                            </li>
                          )}
                          {hasFeature(plan, "plagiarism") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Plagiarism detection & fixing</span>
                            </li>
                          )}
                          {hasFeature(plan, "brief") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Professional writing brief</span>
                            </li>
                          )}
                          {hasFeature(plan, "export") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>All export formats</span>
                            </li>
                          )}
                          {hasFeature(plan, "priority") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Priority processing</span>
                            </li>
                          )}
                          {hasFeature(plan, "api") && (
                            <li className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>API access</span>
                            </li>
                          )}
                          
                          {/* Features not included */}
                          {!hasFeature(plan, "plagiarism") && (
                            <li className="flex items-start text-muted-foreground">
                              <X className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Plagiarism detection</span>
                            </li>
                          )}
                          {!hasFeature(plan, "brief") && (
                            <li className="flex items-start text-muted-foreground">
                              <X className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Professional writing brief</span>
                            </li>
                          )}
                          {!hasFeature(plan, "export") && (
                            <li className="flex items-start text-muted-foreground">
                              <X className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Limited export options</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col border-t pt-6">
                      <Button
                        className={`w-full mb-3 ${plan.name.toLowerCase().includes("pro") ? "bg-primary" : ""}`}
                        onClick={() => handlePlanSelect(plan.id)}
                        disabled={userSubscription?.planId === plan.id && userSubscription?.status === 'active'}
                      >
                        {userSubscription?.planId === plan.id && userSubscription?.status === 'active' 
                          ? "Current Plan" 
                          : "Select Plan"}
                      </Button>
                      
                      {plan.trialPeriodDays && (
                        <span className="text-xs text-muted-foreground">
                          Includes {plan.trialPeriodDays}-day free trial
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {selectedPlanId && selectedPlan && (
                <div className="mt-10 border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-semibold mb-4">Checkout Summary</h3>
                  
                  <div className="mb-6 border-b pb-4">
                    <div className="flex justify-between mb-2">
                      <span>Selected Plan:</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Billing Cycle:</span>
                      <span className="font-medium capitalize">{billingCycle}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Auto-renewal:</span>
                      <div className="flex items-center">
                        <Switch
                          checked={autoRenew}
                          onCheckedChange={setAutoRenew}
                          className="mr-2"
                        />
                        <Label>{autoRenew ? "Yes" : "No"}</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-lg font-bold">Total:</span>
                      <span className="block text-sm text-muted-foreground">
                        {autoRenew 
                          ? `Recurring ${billingCycle === "yearly" ? "annually" : "monthly"}`
                          : "One-time payment"}
                      </span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatPrice(paymentAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center space-x-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      <span>Secure payment processing</span>
                    </div>
                    <Button 
                      onClick={handleInitiateSubscription}
                      className="min-w-[150px]"
                      disabled={isSubscribeMutationLoading}
                    >
                      {isSubscribeMutationLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {paymentStep === "checkout" && selectedPlan && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Payment</CardTitle>
                  <CardDescription>
                    Complete your subscription payment to activate {selectedPlan.name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-6 border-b pb-4">
                    <div className="flex justify-between mb-2">
                      <span>Plan:</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Billing Cycle:</span>
                      <span className="font-medium capitalize">{billingCycle}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Amount:</span>
                      <span className="font-medium">{formatPrice(paymentAmount)}</span>
                    </div>
                  </div>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <Label className="mb-2 block">Select Payment Method</Label>
                    <Tabs 
                      defaultValue="paypal" 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as "paypal" | "crypto")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="paypal" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          PayPal
                        </TabsTrigger>
                        <TabsTrigger value="crypto" className="flex items-center gap-2">
                          <Bitcoin className="h-4 w-4" />
                          Cryptocurrency
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* PayPal Payment Option */}
                      <TabsContent value="paypal" className="py-4">
                        <div className="flex items-center justify-center mb-6">
                          <Button variant="outline" className="h-16 w-60 flex flex-col gap-1 items-center">
                            <paypal-button id="paypal-button"></paypal-button>
                          </Button>
                        </div>
                        
                        <PayPalButton
                          amount={paymentAmount.toString()}
                          currency="USD"
                          intent="CAPTURE"
                        />
                      </TabsContent>
                      
                      {/* Crypto Payment Option */}
                      <TabsContent value="crypto" className="py-4">
                        <div className="mb-4 p-4 bg-muted rounded-lg">
                          <h3 className="text-sm font-medium mb-2">Equivalent Crypto Prices:</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                              <Bitcoin className="h-5 w-5 text-amber-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Bitcoin (BTC)</p>
                                <p className="font-mono">{calculateCryptoPrice(paymentAmount, "bitcoin")} BTC</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                              <Coins className="h-5 w-5 text-purple-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Solana (SOL)</p>
                                <p className="font-mono">{calculateCryptoPrice(paymentAmount, "solana")} SOL</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                              <CreditCard className="h-5 w-5 text-teal-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">USDT</p>
                                <p className="font-mono">{calculateCryptoPrice(paymentAmount, "usdt")} USDT</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <CryptoPayment
                          planId={selectedPlan.id}
                          planName={selectedPlan.name}
                          planPrice={paymentAmount.toString()}
                          onSuccess={handleCryptoPaymentSuccess}
                          onCancel={() => setPaymentStep("select")}
                        />
                      </TabsContent>
                    </Tabs>
                    
                    <div className="mt-4 text-xs text-center text-muted-foreground">
                      <div className="flex items-center justify-center mb-2">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        <span>All transactions are secure and encrypted</span>
                      </div>
                      <p>
                        By completing this payment, you agree to our Terms of Service and Privacy Policy.
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentStep("select")}
                  >
                    Back
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {paymentStep === "confirmation" && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center">
                    <Check className="h-8 w-8 mr-3 text-green-500" />
                    <div>
                      <CardTitle className="text-green-700 dark:text-green-300">
                        Payment Successful!
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Your subscription has been activated
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="border rounded-md p-4 mb-6">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Receipt className="h-5 w-5 mr-2" /> 
                      Receipt
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono">{transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span>{paymentMethod === "crypto" ? "Cryptocurrency" : "PayPal"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">{formatPrice(paymentAmount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                    <div className="flex gap-3">
                      <Zap className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Your GhostliAI Pro features are now activated!
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                          You now have access to all Pro features. Enjoy enhanced content generation with advanced capabilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = "/"}
                  >
                    Go to Dashboard
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Current Subscription Tab */}
        <TabsContent value="current">
          {userSubscription ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>
                      Manage your active subscription
                    </CardDescription>
                  </div>
                  {getStatusBadge(userSubscription.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-3">Subscription Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium">{userSubscription.plan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium">{formatPrice(userSubscription.plan.price)}/{userSubscription.plan.interval}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(userSubscription.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Billing Date</p>
                        <p className="font-medium">
                          {userSubscription.endDate 
                            ? new Date(userSubscription.endDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{userSubscription.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Auto-renew</p>
                        <div className="flex items-center mt-1">
                          <Switch
                            checked={!userSubscription.cancelledAt}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                handleCancelSubscription();
                              }
                            }}
                            disabled={userSubscription.status !== "active"}
                            className="mr-2"
                          />
                          <Label>{userSubscription.cancelledAt ? "No" : "Yes"}</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="features">
                      <AccordionTrigger>
                        Included Features
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                          {hasFeature(userSubscription.plan, "unlimited") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Unlimited content generation</span>
                            </div>
                          )}
                          {hasFeature(userSubscription.plan, "cloning") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Writing style cloning</span>
                            </div>
                          )}
                          {hasFeature(userSubscription.plan, "plagiarism") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Plagiarism detection & fixing</span>
                            </div>
                          )}
                          {hasFeature(userSubscription.plan, "brief") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Professional writing brief</span>
                            </div>
                          )}
                          {hasFeature(userSubscription.plan, "export") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>All export formats</span>
                            </div>
                          )}
                          {hasFeature(userSubscription.plan, "priority") && (
                            <div className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>Priority processing</span>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="cancel">
                      <AccordionTrigger>
                        Cancel Subscription
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 border rounded-md bg-muted space-y-4">
                          <p className="text-sm">
                            {userSubscription.cancelledAt 
                              ? "Your subscription is already set to cancel at the end of the current billing period."
                              : "Canceling your subscription will still give you access until the end of your current billing period."}
                          </p>
                          
                          {!userSubscription.cancelledAt && (
                            <Button
                              variant="destructive"
                              onClick={handleCancelSubscription}
                              disabled={isCancelMutationLoading || userSubscription.status !== "active"}
                            >
                              {isCancelMutationLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Cancel Subscription"
                              )}
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                >
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any active subscriptions yet.
              </p>
              <Button
                onClick={() => {
                  const tabsElement = document.querySelector('[data-value="plans"]');
                  if (tabsElement) {
                    (tabsElement as HTMLElement).click();
                  }
                }}
              >
                View Subscription Plans
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          {isLoadingPayments ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentsError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-3" />
              <h3 className="text-lg font-semibold">Error Loading Payment History</h3>
              <p className="text-muted-foreground">
                We encountered an issue while loading your payment history.
              </p>
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Transaction ID</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {payment.id}
                      </td>
                      <td className="py-3 px-4">
                        {formatPrice(payment.amount)}
                      </td>
                      <td className="py-3 px-4">
                        {payment.status === "completed" ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : payment.status === "pending" ? (
                          <Badge variant="outline">Pending</Badge>
                        ) : payment.status === "failed" ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <Badge>{payment.status}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {payment.paymentMethod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Payment History</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any payments yet.
              </p>
              <Button
                onClick={() => {
                  const tabsElement = document.querySelector('[data-value="plans"]');
                  if (tabsElement) {
                    (tabsElement as HTMLElement).click();
                  }
                }}
              >
                View Subscription Plans
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionPage;