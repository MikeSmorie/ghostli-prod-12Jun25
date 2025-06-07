import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Zap, 
  Crown, 
  ArrowLeft,
  DollarSign,
  Gift,
  Star,
  Sparkles,
  Bitcoin,
  Shield,
  Clock,
  CheckCircle,
  Info
} from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import CreditsDisplay from "@/components/credits-display";

// Import payment components
import PayPalButtonComplete from "@/components/PayPalButtonComplete";
import PaymentTestButton from "@/components/PaymentTestButton";
import DirectPurchaseButton from "@/components/DirectPurchaseButton";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
  badge?: string;
}

export default function BuyCreditsPage() {
  const [, navigate] = useLocation();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto">("paypal");
  const [cryptoType, setCryptoType] = useState<"bitcoin" | "ethereum" | "usdt">("bitcoin");
  const [showCryptoInstructions, setShowCryptoInstructions] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const creditPackages: CreditPackage[] = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 500,
      price: 5,
      bonus: 50,
      badge: "Good Start"
    },
    {
      id: "popular",
      name: "Popular Pack",
      credits: 1000,
      price: 10,
      bonus: 250,
      popular: true,
      badge: "Best Value"
    },
    {
      id: "pro",
      name: "Pro Pack",
      credits: 2500,
      price: 25,
      bonus: 750,
      badge: "Most Credits"
    },
    {
      id: "enterprise",
      name: "Enterprise Pack",
      credits: 5000,
      price: 50,
      bonus: 2000,
      badge: "Maximum Savings"
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
  };

  const getPaymentAmount = () => {
    if (selectedPackage) {
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      return pkg?.price.toString() || "0";
    }
    return customAmount || "0";
  };

  const getCreditsForAmount = (amount: number) => {
    return amount * 100; // 100 credits per $1
  };

  const getTotalCredits = () => {
    if (selectedPackage) {
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      return pkg ? pkg.credits + pkg.bonus : 0;
    }
    if (customAmount && parseFloat(customAmount) > 0) {
      return getCreditsForAmount(parseFloat(customAmount));
    }
    return 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Buy Credits</h1>
          </div>
        </div>
        <CreditsDisplay />
      </div>

      {/* PRO Benefits Banner */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-primary/5 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Unlock PRO Features</h2>
            <Badge className="bg-purple-600 text-white">Auto Upgrade</Badge>
          </div>
          <p className="text-muted-foreground mb-4">
            Purchase any amount of credits and automatically unlock PRO tier with 20% better credit efficiency and access to all premium features.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Clone Me Feature</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-600" />
              <span>AI Detection Shield</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>20% Credit Efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-600" />
              <span>Priority Support</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Credit Packages */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Choose a Credit Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                } ${pkg.popular ? 'relative border-purple-200' : ''}`}
                onClick={() => handlePackageSelect(pkg.id)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                    {pkg.badge}
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    {pkg.badge && !pkg.popular && (
                      <Badge variant="outline">{pkg.badge}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-2xl font-bold text-primary">
                    ${pkg.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base Credits:</span>
                      <span className="font-medium">{pkg.credits.toLocaleString()}</span>
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span className="text-sm">Bonus Credits:</span>
                        <span className="font-medium">+{pkg.bonus.toLocaleString()}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Credits:</span>
                      <span className="text-primary">{(pkg.credits + pkg.bonus).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Amount</CardTitle>
              <CardDescription>
                Enter any amount from $1 to $1000 (100 credits per $1)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custom-amount"
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {customAmount && parseFloat(customAmount) > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>You'll receive:</span>
                      <span className="font-semibold text-primary">
                        {getCreditsForAmount(parseFloat(customAmount)).toLocaleString()} credits
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPackage ? (
                (() => {
                  const pkg = creditPackages.find(p => p.id === selectedPackage);
                  return pkg ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Package:</span>
                        <span className="font-medium">{pkg.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Credits:</span>
                        <span className="font-medium">{pkg.credits.toLocaleString()}</span>
                      </div>
                      {pkg.bonus > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Bonus Credits:</span>
                          <span className="font-medium">+{pkg.bonus.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">${pkg.price}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Credits:</span>
                        <span className="text-primary">{(pkg.credits + pkg.bonus).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Price:</span>
                        <span className="text-primary">${pkg.price}</span>
                      </div>
                    </div>
                  ) : null;
                })()
              ) : customAmount && parseFloat(customAmount) > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${parseFloat(customAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits (100 per $1):</span>
                    <span className="font-medium">{getCreditsForAmount(parseFloat(customAmount)).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">${parseFloat(customAmount).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a package or enter a custom amount to see payment options</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {(selectedPackage || (customAmount && parseFloat(customAmount) > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Choose Payment Method
                </CardTitle>
                <CardDescription>
                  Select your preferred payment option below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "paypal" | "crypto")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paypal" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      PayPal
                    </TabsTrigger>
                    <TabsTrigger value="crypto" className="flex items-center gap-2">
                      <Bitcoin className="h-4 w-4" />
                      Crypto
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="paypal" className="space-y-4 mt-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Secure payment processing with instant credit allocation</span>
                      </div>
                      
                      {/* Direct Payment Completion */}
                      <div className="space-y-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-800 justify-center font-medium">
                          <CreditCard className="h-4 w-4" />
                          <span>Instant Credit Purchase</span>
                        </div>
                        <DirectPurchaseButton
                          amount={getPaymentAmount()}
                          creditAmount={getTotalCredits()}
                          onSuccess={() => {
                            // Refresh credits after successful payment
                            window.location.reload();
                          }}
                        />
                        <div className="text-xs text-blue-700 text-center">
                          Direct processing • {getTotalCredits()} credits added immediately
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Credits added instantly after payment</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="crypto" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <Label>Select Cryptocurrency</Label>
                      <Tabs value={cryptoType} onValueChange={(value) => setCryptoType(value as "bitcoin" | "ethereum" | "usdt")}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
                          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
                          <TabsTrigger value="usdt">USDT</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                              <Bitcoin className="h-5 w-5" />
                              <span className="font-medium">
                                Send {cryptoType.toUpperCase()} to complete purchase
                              </span>
                            </div>
                            <Button 
                              onClick={() => setShowCryptoInstructions(true)}
                              className="w-full"
                            >
                              Get {cryptoType.toUpperCase()} Payment Address
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              Manual crypto payments require verification (1-3 business days)
                            </div>
                          </div>
                        </div>
                      </Tabs>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Benefits Reminder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                What You Get
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Instant PRO tier upgrade with your first purchase</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>20% better credit efficiency for all content generation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Access to Clone Me, AI Detection Shield, and all premium features</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Priority customer support and faster response times</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>No subscription fees - pay only for credits you use</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Crypto Payment Instructions Dialog */}
      <Dialog open={showCryptoInstructions} onOpenChange={setShowCryptoInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5" />
              {cryptoType.toUpperCase()} Payment Instructions
            </DialogTitle>
            <DialogDescription>
              Send exactly the amount below to complete your purchase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Address</Label>
                  <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                    {cryptoType === "bitcoin" && "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"}
                    {cryptoType === "ethereum" && "0x742D35CC892A0F3f1C63B3f1e3E3F4b2b4B4C4C4"}
                    {cryptoType === "usdt" && "0x742D35CC892A0F3f1C63B3f1e3E3F4b2b4B4C4C4"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount to Send</Label>
                  <div className="p-2 bg-background rounded border font-mono text-sm">
                    {cryptoType === "bitcoin" && `${(parseFloat(getPaymentAmount()) * 0.000023).toFixed(8)} BTC`}
                    {cryptoType === "ethereum" && `${(parseFloat(getPaymentAmount()) * 0.00029).toFixed(6)} ETH`}
                    {cryptoType === "usdt" && `${getPaymentAmount()} USDT`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• Send exactly this amount to avoid delays</p>
                  <p>• Include transaction ID in payment notes</p>
                  <p>• Credits will be added within 1-3 business days</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                toast({
                  title: "Payment Instructions Saved",
                  description: "We'll notify you once payment is confirmed",
                });
                setShowCryptoInstructions(false);
              }}
              className="w-full"
            >
              I've Sent the Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}