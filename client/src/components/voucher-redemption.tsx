import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ticket, Gift, Users, ArrowRight, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoucherRedemptionProps {
  onSuccess?: (result: any) => void;
}

export function VoucherRedemption({ onSuccess }: VoucherRedemptionProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<any>(null);
  const { toast } = useToast();

  const handleRedeem = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a voucher code",
        variant: "destructive"
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch("/api/voucher/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ voucherCode: voucherCode.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setRedemptionResult(result);
        toast({
          title: "Voucher Redeemed!",
          description: result.creditsAwarded 
            ? `You received ${result.creditsAwarded} credits!` 
            : "Voucher redeemed successfully!",
          variant: "default"
        });
        setVoucherCode("");
        onSuccess?.(result);
      } else {
        toast({
          title: "Redemption Failed",
          description: result.message || "Invalid voucher code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem voucher. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRedeeming) {
      handleRedeem();
    }
  };

  return (
    <div className="space-y-6">
      {/* Voucher Redemption Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Redeem Voucher or Referral Code
          </CardTitle>
          <CardDescription>
            Enter a voucher code to unlock discounts or bonus credits. Referral codes reward both you and your referrer!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter voucher or referral code"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isRedeeming}
              className="flex-1"
            />
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || !voucherCode.trim()}
              className="min-w-[100px]"
            >
              {isRedeeming ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
          
          {redemptionResult && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Check className="h-4 w-4" />
                <span className="font-medium">Voucher Redeemed Successfully!</span>
              </div>
              {redemptionResult.creditsAwarded > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  +{redemptionResult.creditsAwarded} credits added to your account
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Program Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Invite friends and earn credits when they join GhostliAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Gift className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Refer Friends</p>
                  <p className="text-xs text-muted-foreground">Share your referral code</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Earn Credits</p>
                  <p className="text-xs text-muted-foreground">Both get bonus credits</p>
                </div>
              </div>
            </div>
            
            <ReferralCodeDisplay />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralCodeDisplay() {
  const [referralData, setReferralData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchReferralCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/voucher/referral", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralCode) {
      const link = `${window.location.origin}?ref=${referralData.referralCode}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (!referralData && !isLoading) {
    return (
      <Button onClick={fetchReferralCode} variant="outline" className="w-full">
        <Users className="h-4 w-4 mr-2" />
        Get Your Referral Code
      </Button>
    );
  }

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">Loading referral data...</div>;
  }

  return (
    <div className="space-y-4">
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Your Referral Code:</span>
          <Badge variant="secondary" className="font-mono">
            {referralData?.referralCode}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={copyReferralCode} variant="outline" size="sm" className="flex-1">
            Copy Code
          </Button>
          <Button onClick={copyReferralLink} variant="outline" size="sm" className="flex-1">
            Copy Link
          </Button>
        </div>

        {referralData?.stats && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{referralData.stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{referralData.stats.totalCreditsEarned}</p>
              <p className="text-xs text-muted-foreground">Credits Earned</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}