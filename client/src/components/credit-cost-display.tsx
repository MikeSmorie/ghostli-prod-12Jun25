import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Zap, TrendingUp, AlertTriangle, CreditCard, Bitcoin } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { getQueryFn } from "@/lib/queryClient";

interface CreditCostInfo {
  userTier: string;
  creditsPerGeneration: number;
  currentBalance: number;
  canAfford: boolean;
  generationsRemaining: number;
}

export default function CreditCostDisplay() {
  const { user } = useUser();

  const { data: costInfo, isLoading } = useQuery<CreditCostInfo>({
    queryKey: ["/api/credits/cost-info"],
    queryFn: getQueryFn(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user) {
    return null;
  }

  if (isLoading || !costInfo) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="h-8 w-8 bg-muted rounded-full"></div>
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { userTier, creditsPerGeneration, currentBalance, canAfford, generationsRemaining } = costInfo;
  const isLowCredits = generationsRemaining < 3;
  const isCriticalCredits = !canAfford;

  return (
    <div className="space-y-3">
      {/* Credit Cost Info */}
      <Card className={`border ${isCriticalCredits ? 'border-destructive bg-destructive/5' : isLowCredits ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isCriticalCredits ? 'bg-destructive/10' : isLowCredits ? 'bg-orange-100' : 'bg-green-100'}`}>
                <Coins className={`h-4 w-4 ${isCriticalCredits ? 'text-destructive' : isLowCredits ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Generation Cost:</span>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {creditsPerGeneration} credits
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {userTier.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Balance: {currentBalance.toLocaleString()} • Remaining: {generationsRemaining} generations
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Credits Warning */}
      {isLowCredits && (
        <Alert variant={isCriticalCredits ? "destructive" : "default"} className={isCriticalCredits ? '' : 'border-orange-300 bg-orange-50'}>
          <AlertTriangle className={`h-4 w-4 ${isCriticalCredits ? '' : 'text-orange-600'}`} />
          <AlertDescription className={isCriticalCredits ? '' : 'text-orange-800'}>
            {isCriticalCredits 
              ? "Insufficient credits to generate content. Please top up to continue."
              : "Low credit balance. Consider topping up to avoid interruptions."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Top-up Buttons */}
      {isLowCredits && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={isCriticalCredits ? "default" : "outline"}
            onClick={() => window.location.href = '/subscription'}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            PayPal Top-up
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/crypto-dashboard'}
            className="flex-1"
          >
            <Bitcoin className="h-4 w-4 mr-2" />
            Bitcoin Top-up
          </Button>
        </div>
      )}
    </div>
  );
}