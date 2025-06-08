import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ticket, Gift, Users, ArrowRight, Check, AlertCircle, Copy } from "lucide-react";
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
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        toast({
          title: "Redemption Failed",
          description: result.message || "Failed to redeem voucher",
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

  return (
    <div className="space-y-6">
      {/* Voucher Redemption Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Redeem Voucher
          </CardTitle>
          <CardDescription>
            Enter a voucher code to get free credits or subscription benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter voucher code..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="flex-1"
                maxLength={20}
              />
              <Button 
                onClick={handleRedeem}
                disabled={isRedeeming || !voucherCode.trim()}
                className="px-6"
              >
                {isRedeeming ? "Redeeming..." : "Redeem"}
              </Button>
            </div>

            {redemptionResult && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Voucher Redeemed Successfully!
                  </p>
                  {redemptionResult.creditsAwarded && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You received {redemptionResult.creditsAwarded} credits
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Sample codes: WELCOME50, PREMIUM100, BOOST25
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral System Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Invite friends and earn credits together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div>
          <p className="font-mono text-sm font-bold">{referralData.referralCode}</p>
          <p className="text-xs text-muted-foreground">Your referral code</p>
        </div>
        <Button size="sm" variant="outline" onClick={copyReferralCode}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={copyReferralLink}
        className="w-full"
      >
        Copy Referral Link
      </Button>

      {referralData.stats && (
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-blue-600">{referralData.stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{referralData.stats.totalCreditsEarned}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </div>
        </div>
      )}
    </div>
  );
}