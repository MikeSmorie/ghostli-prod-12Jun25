import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Shield, CreditCard, TrendingUp, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LaunchMetrics {
  totalUsers: number;
  activeUsersThisWeek: number;
  totalGenerations: number;
  totalDetectionRuns: number;
  totalCreditsPurchased: number;
  averageGenerationsPerUser: number;
  newUsersToday: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  type: string;
  timestamp: string;
  userId: number;
  details?: any;
}

export default function LaunchMetrics() {
  const { data: metrics, isLoading } = useQuery<LaunchMetrics>({
    queryKey: ["/api/supergod/launch-metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Launch Metrics</h1>
          <p className="text-muted-foreground">No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Launch Metrics</h1>
          <p className="text-muted-foreground">Real-time monitoring of GhostliAI public launch</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Live Monitoring
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-green-600">
              +{metrics.newUsersToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsersThisWeek.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.activeUsersThisWeek / metrics.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGenerations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageGenerationsPerUser.toFixed(1)} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Shield Runs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDetectionRuns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalDetectionRuns / metrics.totalGenerations) * 100).toFixed(1)}% of generations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Revenue Metrics
            </CardTitle>
            <CardDescription>Credit purchases and conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Credits Purchased</span>
              <span className="text-lg font-bold">{metrics.totalCreditsPurchased.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-lg font-bold">
                {((metrics.totalCreditsPurchased > 0 ? 1 : 0) / metrics.totalUsers * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Revenue (Est.)</span>
              <span className="text-lg font-bold">
                ${(metrics.totalCreditsPurchased * 0.01).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
            <CardDescription>User activity patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Retention Rate</span>
              <span className="text-lg font-bold">
                {((metrics.activeUsersThisWeek / metrics.totalUsers) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Generations/User</span>
              <span className="text-lg font-bold">
                {metrics.averageGenerationsPerUser.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Shield Usage Rate</span>
              <span className="text-lg font-bold">
                {((metrics.totalDetectionRuns / metrics.totalGenerations) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Live feed of key user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      activity.type === 'USER_REGISTERED' ? 'default' :
                      activity.type === 'FIRST_GENERATION' ? 'secondary' :
                      activity.type === 'FIRST_PURCHASE' ? 'success' :
                      'outline'
                    }>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm">User {activity.userId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}