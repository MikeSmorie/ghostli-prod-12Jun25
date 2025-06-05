import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface WelcomeMessageProps {
  isNewUser?: boolean;
  freeCredits?: number;
  onDismiss?: () => void;
}

export function WelcomeMessage({ isNewUser = false, freeCredits = 100, onDismiss }: WelcomeMessageProps) {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(isNewUser);

  useEffect(() => {
    if (isNewUser) {
      setIsVisible(true);
    }
  }, [isNewUser]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleStartGenerating = () => {
    navigate("/content-generator");
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Welcome to GhostliAI!
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Gift className="h-5 w-5 text-green-600" />
          <span className="text-green-700 dark:text-green-300 font-medium">
            You've received <Badge variant="secondary" className="mx-1 bg-green-100 text-green-800">{freeCredits} free credits</Badge> to get started!
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-muted-foreground">
            Explore GhostliAI's powerful content generation tools. Create high-quality, AI-undetectable content and upgrade anytime to unlock advanced features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm text-primary">✓ FREE Features</h4>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Quick Brief content generation</li>
                <li>• Up to 1,000 words per generation</li>
                <li>• Anti-AI detection technology</li>
              </ul>
            </div>
            <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-primary/5 dark:from-purple-950/20 dark:to-primary/5">
              <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300">⭐ Pro Features</h4>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Detailed Brief + Clone Me</li>
                <li>• Up to 5,000 words per generation</li>
                <li>• 20% credit discount</li>
                <li>• Analytics & AI Detection Shield</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleStartGenerating} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            Start Generating Content
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Explore Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}