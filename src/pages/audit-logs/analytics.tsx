import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditStats } from "./hooks/useAuditStats";
import { StatsOverview } from "./components/StatsOverview";
import { TimeSeriesChart } from "./components/TimeSeriesChart";
import { UserActivityChart } from "./components/UserActivityChart";
import { TableDistributionChart } from "./components/TableDistributionChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditAnalyticsPage() {
  const [period, setPeriod] = useState<number>(30);
  const { data: stats, isLoading, refetch, isFetching } = useAuditStats(period);

  const handleExport = () => {
    if (!stats) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Changes', stats.totalChanges],
      ['Critical Changes', stats.criticalChanges],
      ['High Priority Changes', stats.highPriorityChanges],
      ['Unique Users', stats.uniqueUsers],
      ['Last 7 Days', stats.recentTrends.last7Days],
      ['Last 30 Days', stats.recentTrends.last30Days],
      ['Last 90 Days', stats.recentTrends.last90Days],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-analytics-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Audit Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Analyze system changes and user activity patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={!stats}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats ? (
          <StatsOverview
            totalChanges={stats.totalChanges}
            criticalChanges={stats.criticalChanges}
            highPriorityChanges={stats.highPriorityChanges}
            uniqueUsers={stats.uniqueUsers}
            recentTrends={stats.recentTrends}
            isLoading={isLoading}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series Chart */}
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : stats?.timeSeriesData ? (
            <TimeSeriesChart data={stats.timeSeriesData} />
          ) : null}

          {/* Table Distribution Chart */}
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : stats?.tableDistribution ? (
            <TableDistributionChart data={stats.tableDistribution} />
          ) : null}
        </div>

        {/* User Activity Chart */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : stats?.userActivityData ? (
          <UserActivityChart data={stats.userActivityData} />
        ) : null}

        {/* Insights */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                Automated analysis of your audit data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <span className="font-medium">Most Active User:</span>{' '}
                    {stats.userActivityData[0]?.user_email || 'N/A'} with{' '}
                    {stats.userActivityData[0]?.total_changes || 0} changes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <span className="font-medium">Most Changed Table:</span>{' '}
                    {stats.tableDistribution[0]?.table_name || 'N/A'} with{' '}
                    {stats.tableDistribution[0]?.count || 0} changes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5" />
                  <div>
                    <span className="font-medium">Daily Average:</span>{' '}
                    {Math.round(stats.totalChanges / period)} changes per day
                  </div>
                </div>
                {stats.criticalChanges > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Security Alert:
                      </span>{' '}
                      {stats.criticalChanges} critical changes detected in stores or user roles
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
