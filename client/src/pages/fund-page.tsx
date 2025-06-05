import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  Target, 
  Users, 
  Star, 
  Crown, 
  Zap, 
  Shield,
  ArrowRight,
  Heart,
  Trophy
} from "lucide-react";
import { useLocation } from "wouter";
import Footer from "@/components/footer";

export default function FundPage() {
  const [, navigate] = useLocation();

  const handleBackCredits = () => {
    navigate("/buy-credits");
  };

  const handleJoinEarly = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-50 to-pink-50 dark:from-primary/5 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-purple-600 to-primary text-white px-4 py-2">
                <Rocket className="h-4 w-4 mr-2" />
                Pre-Launch Campaign
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Support the Launch of GhostliAI
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Early backers get exclusive Pro credits & founder badges. 
              Join us in revolutionizing AI-powered content creation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={handleBackCredits}
                className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white px-8 py-6 text-lg"
              >
                <Heart className="h-5 w-5 mr-2" />
                Back GhostliAI Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleJoinEarly}
                className="px-8 py-6 text-lg"
              >
                Join Early Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Progress */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Campaign Progress</CardTitle>
            <p className="text-muted-foreground">Help us reach our funding goal</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>$12,450 raised</span>
                <span>Goal: $50,000</span>
              </div>
              <Progress value={25} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                25% funded • 42 backers • 28 days remaining
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">42</div>
                <div className="text-xs text-muted-foreground">Backers</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">$295</div>
                <div className="text-xs text-muted-foreground">Avg. Pledge</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">28</div>
                <div className="text-xs text-muted-foreground">Days Left</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Founder Rewards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Exclusive Founder Rewards</h2>
          <p className="text-lg text-muted-foreground">
            Early supporters get special perks and lifetime benefits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <CardTitle>Supporter - $25</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  500 bonus Pro credits
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="h-4 w-4 text-blue-500" />
                  Early Supporter badge
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Community access
                </li>
              </ul>
              <Button onClick={handleBackCredits} className="w-full">
                Back This Tier
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-primary/5 dark:from-purple-950/20 dark:to-primary/10">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-primary text-white">
              Most Popular
            </Badge>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-purple-500" />
                <CardTitle>Champion - $100</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  2,500 bonus Pro credits
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Founder Champion badge
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Lifetime 10% credit discount
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Beta feature early access
                </li>
              </ul>
              <Button onClick={handleBackCredits} className="w-full bg-gradient-to-r from-purple-600 to-primary">
                Back This Tier
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                <CardTitle>Legend - $500</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  15,000 bonus Pro credits
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Exclusive Founder Legend badge
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Lifetime 25% credit discount
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  Direct line to founder team
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Name in credits
                </li>
              </ul>
              <Button onClick={handleBackCredits} className="w-full">
                Back This Tier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Why Support */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Support GhostliAI?</h2>
            <p className="text-lg text-muted-foreground">
              Help us build the future of AI-powered content creation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Our Mission
              </h3>
              <p className="text-muted-foreground">
                To democratize high-quality content creation with advanced AI that remains undetectable, 
                empowering creators, marketers, and businesses worldwide.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Rocket className="h-5 w-5 text-purple-600" />
                Your Impact
              </h3>
              <p className="text-muted-foreground">
                Your support directly funds research, development, and infrastructure to bring 
                cutting-edge AI writing technology to creators everywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make History?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of early supporters and help shape the future of AI content creation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleBackCredits}
              className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white px-8 py-6 text-lg"
            >
              <Heart className="h-5 w-5 mr-2" />
              Support GhostliAI
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleJoinEarly}
              className="px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}