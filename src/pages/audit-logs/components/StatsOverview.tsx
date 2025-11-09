import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Users, Shield, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsOverviewProps {
  totalChanges: number;
  criticalChanges: number;
  highPriorityChanges: number;
  uniqueUsers: number;
  recentTrends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  isLoading?: boolean;
}

export function StatsOverview({
  totalChanges,
  criticalChanges,
  highPriorityChanges,
  uniqueUsers,
  recentTrends,
  isLoading,
}: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const weeklyChange = recentTrends.last7Days;
  const monthlyAvg = Math.round(recentTrends.last30Days / 30);
  const dailyAvg = Math.round(recentTrends.last7Days / 7);
  const trend = dailyAvg > monthlyAvg ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Total Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalChanges.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            {dailyAvg}/day avg
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Critical Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {criticalChanges}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Stores & User Roles
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            High Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {highPriorityChanges}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Orders, Users, Webhooks
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{uniqueUsers}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Last {recentTrends.last90Days} days
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
