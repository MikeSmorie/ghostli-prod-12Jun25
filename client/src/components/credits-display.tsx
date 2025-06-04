import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { getQueryFn } from "@/lib/queryClient";

interface CreditInfo {
  balance: number;
  tier: string;
  creditsPerGeneration: number;
  generationsRemaining: number;
  lastTransactions: Array<{
    id: number;
    type: string;
    amount: number;
    source: string;
    createdAt: string;
  }>;
}

export default function CreditsDisplay() {
  const { user } = useUser();

  const { data: creditInfo, isLoading, error } = useQuery<CreditInfo>({
    queryKey: ["/api/credits/balance"],
    queryFn: getQueryFn(),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Ghostli Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !creditInfo) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Credit System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load credit information. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { balance = 0, tier, creditsPerGeneration, generationsRemaining } = creditInfo || {};
  const userTier = tier || user.role || 'lite'; // Fallback to user role or 'lite' if tier is undefined
  const creditCost = creditsPerGeneration || 10; // Default cost if undefined
  const currentBalance = balance || 0; // Ensure balance is never undefined
  const isLowCredits = currentBalance < creditCost * 3; // Warning when less than 3 generations left
  const isCriticalCredits = currentBalance < creditCost; // Critical when can't afford 1 generation

  return (
    <Card className={`w-full ${isCriticalCredits ? 'border-destructive' : isLowCredits ? 'border-orange-500' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Ghostli Credits
          </div>
          <Badge variant={userTier === 'lite' ? 'secondary' : 'default'}>
            {userTier.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{currentBalance.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          
          {/* Generation capacity indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Generations remaining:</span>
              <span className={`font-medium ${isCriticalCredits ? 'text-destructive' : isLowCredits ? 'text-orange-600' : 'text-green-600'}`}>
                {generationsRemaining || Math.floor(currentBalance / creditCost)}
              </span>
            </div>
            <Progress 
              value={Math.min(100, ((generationsRemaining || Math.floor(currentBalance / creditCost)) / 10) * 100)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Tier Information */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Cost per generation:</span>
          </div>
          <span className="text-sm font-bold">{creditCost} credits</span>
        </div>

        {/* Low Credits Warning */}
        {isLowCredits && (
          <div className={`p-3 rounded-lg border ${isCriticalCredits ? 'bg-destructive/10 border-destructive' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${isCriticalCredits ? 'text-destructive' : 'text-orange-600'}`} />
              <span className={`text-sm font-medium ${isCriticalCredits ? 'text-destructive' : 'text-orange-600'}`}>
                {isCriticalCredits ? 'Insufficient Credits' : 'Low Credit Balance'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isCriticalCredits 
                ? 'Please top up your credits to continue generating content.'
                : 'Consider purchasing more credits to avoid interruptions.'
              }
            </p>
          </div>
        )}

        {/* Purchase Credits Button */}
        <Button 
          className="w-full" 
          variant={isCriticalCredits ? "default" : "outline"}
          onClick={() => window.location.href = '/subscription'}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {isCriticalCredits ? 'Buy Credits Now' : 'Top Up Credits'}
        </Button>

        {/* Recent Activity Summary */}
        {creditInfo.lastTransactions && creditInfo.lastTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-1">
              {creditInfo.lastTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {transaction.source}
                  </span>
                  <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}