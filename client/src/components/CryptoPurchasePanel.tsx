import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, Copy, Loader2, RefreshCw } from "lucide-react";

interface CryptoQuote {
  amount: string;
  symbol: string;
  usdValue: number;
  price: number;
  formattedAmount: string;
}

interface CryptoQuotes {
  bitcoin: CryptoQuote;
  solana: CryptoQuote;
}

interface CryptoPurchasePanelProps {
  usdAmount: string;
  creditAmount: number;
  onSuccess?: () => void;
}

export default function CryptoPurchasePanel({ usdAmount, creditAmount, onSuccess }: CryptoPurchasePanelProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<"bitcoin" | "solana" | "usdt">("usdt");
  const [quotes, setQuotes] = useState<CryptoQuotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (selectedCrypto === "usdt") return; // USDT doesn't need dynamic pricing
    
    setLoading(true);
    try {
      const response = await fetch('/api/crypto-quotes/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usdAmount: parseFloat(usdAmount) })
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch quotes');
      }
    } catch (error) {
      console.error('Quote fetch error:', error);
      toast({
        title: "Quote Error",
        description: "Unable to fetch current crypto prices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [usdAmount, selectedCrypto]);

  const getPaymentAmount = () => {
    if (selectedCrypto === "usdt") {
      return `${usdAmount} USDT`;
    }
    if (!quotes) return "Loading...";
    
    if (selectedCrypto === "bitcoin") {
      return quotes.bitcoin.formattedAmount;
    }
    if (selectedCrypto === "solana") {
      return quotes.solana.formattedAmount;
    }
    return "Loading...";
  };

  const getCurrentPrice = () => {
    if (selectedCrypto === "usdt") return "$1.00";
    if (!quotes) return "Loading...";
    
    if (selectedCrypto === "bitcoin") {
      return `$${quotes.bitcoin.price.toLocaleString()}`;
    }
    if (selectedCrypto === "solana") {
      return `$${quotes.solana.price.toFixed(2)}`;
    }
    return "Loading...";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Payment amount copied successfully",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={selectedCrypto} onValueChange={(value) => setSelectedCrypto(value as "bitcoin" | "solana" | "usdt")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
          <TabsTrigger value="solana">Solana</TabsTrigger>
          <TabsTrigger value="usdt">USDT</TabsTrigger>
        </TabsList>

        <TabsContent value="bitcoin" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">Bitcoin Payment</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchQuotes}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current BTC Price:</span>
                    <Badge variant="secondary">{getCurrentPrice()}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Required Amount:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {getPaymentAmount()}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(getPaymentAmount())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {lastUpdated && (
                    <div className="text-xs text-muted-foreground">
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solana" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" />
                    <span className="font-semibold">Solana Payment</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchQuotes}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current SOL Price:</span>
                    <Badge variant="secondary">{getCurrentPrice()}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Required Amount:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {getPaymentAmount()}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(getPaymentAmount())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {lastUpdated && (
                    <div className="text-xs text-muted-foreground">
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usdt" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <span className="font-semibold">USDT Payment</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>USDT Price:</span>
                    <Badge variant="secondary">$1.00 (Stable)</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Required Amount:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {usdAmount} USDT
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(`${usdAmount} USDT`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center space-y-2">
          <h4 className="font-medium text-blue-900">Manual Crypto Payment</h4>
          <p className="text-sm text-blue-800">
            Send exactly <strong>{getPaymentAmount()}</strong> to complete your {creditAmount} credits purchase
          </p>
          <p className="text-xs text-blue-600">
            Contact support with transaction hash for manual verification (1-24 hours)
          </p>
        </div>
      </div>
    </div>
  );
}