import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatCardsProps {
  totalSyncsToday: number;
  totalSyncsYesterday: number;
  errorRate: number;
  avgDuration: number;
  activeStores: number;
}

export const SyncStatCards = ({
  totalSyncsToday,
  totalSyncsYesterday,
  errorRate,
  avgDuration,
  activeStores
}: SyncStatCardsProps) => {
  const trend = totalSyncsToday - totalSyncsYesterday;
  const trendPercentage = totalSyncsYesterday > 0 
    ? ((trend / totalSyncsYesterday) * 100).toFixed(1)
    : '0';

  const errorRateColor = errorRate < 5 
    ? 'text-green-600' 
    : errorRate < 10 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Syncs Today</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSyncsToday}</div>
          <p className="text-xs text-muted-foreground">
            {trend >= 0 ? '+' : ''}{trendPercentage}% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", errorRateColor)}>
            {errorRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {errorRate < 5 ? 'Healthy' : errorRate < 10 ? 'Warning' : 'Critical'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgDuration < 1000 
              ? `${avgDuration.toFixed(0)}ms` 
              : `${(avgDuration / 1000).toFixed(1)}s`}
          </div>
          <p className="text-xs text-muted-foreground">Per successful sync</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeStores}</div>
          <p className="text-xs text-muted-foreground">Synced today</p>
        </CardContent>
      </Card>
    </div>
  );
};
