import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradeCtaProps {
  feature?: string;
  compact?: boolean;
  className?: string;
}

export function UpgradeToProCta({ feature, compact = false, className = "" }: UpgradeCtaProps) {
  const [, navigate] = useLocation();

  const handleUpgrade = () => {
    navigate("/buy-credits");
  };

  if (compact) {
    return (
      <div className={`p-4 bg-gradient-to-r from-purple-50 to-primary/5 dark:from-purple-950/20 dark:to-primary/10 border border-purple-200 dark:border-purple-800 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-700 dark:text-purple-300">
                {feature ? `${feature} requires Pro` : "Upgrade to Pro"}
              </p>
              <p className="text-xs text-muted-foreground">
                Unlock advanced features and higher credit efficiency
              </p>
            </div>
          </div>
          <Button onClick={handleUpgrade} size="sm" className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90">
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-primary/5 dark:from-purple-950/20 dark:to-primary/10 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
            <Crown className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-primary bg-clip-text text-transparent">
            Upgrade to Pro
          </CardTitle>
          <Badge className="bg-gradient-to-r from-purple-500 to-primary text-white">
            Popular
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {feature && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-700 dark:text-amber-300 font-medium text-sm">
              <Zap className="h-4 w-4 inline mr-1" />
              {feature} is a Pro feature
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-muted-foreground">
            Unlock advanced features and get 20% more value from your credits with Pro access.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Pro Benefits
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Clone Me feature</li>
                <li>✓ Detailed Brief mode</li>
                <li>✓ Analytics dashboard</li>
                <li>✓ AI Detection Shield</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <Zap className="h-4 w-4 text-green-600" />
                Enhanced Limits
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Up to 5,000 words</li>
                <li>✓ 20% credit discount</li>
                <li>✓ Priority support</li>
                <li>✓ Advanced customization</li>
              </ul>
            </div>
          </div>
        </div>

        <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90">
          <Crown className="h-4 w-4 mr-2" />
          Buy Credits & Upgrade to Pro
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Pro access activates automatically when you purchase credits
        </p>
      </CardContent>
    </Card>
  );
}