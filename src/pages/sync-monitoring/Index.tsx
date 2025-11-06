import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncStatCards } from "./components/SyncStatCards";
import { SyncFilters } from "./components/SyncFilters";
import { RecentSyncsTable } from "./components/RecentSyncsTable";
import { RecentErrorsTable } from "./components/RecentErrorsTable";
import { SyncCharts } from "./components/SyncCharts";
import { useSyncLogs } from "./hooks/useSyncLogs";
import { useSyncErrors } from "./hooks/useSyncErrors";
import { useSyncStats } from "./hooks/useSyncStats";
import { useState, useMemo } from "react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SyncMonitoring = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [storeId, setStoreId] = useState<string>('all');
  const [entityType, setEntityType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Fetch stores for filter
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch sync logs and errors
  const { data: syncLogs, isLoading: logsLoading } = useSyncLogs({
    dateRange: { from: dateRange.from || new Date(), to: dateRange.to || new Date() },
    storeId,
    entityType,
    status
  });

  const { data: syncErrors, isLoading: errorsLoading } = useSyncErrors({
    dateRange: { from: dateRange.from || new Date(), to: dateRange.to || new Date() },
    storeId,
    entityType
  });

  // Calculate statistics
  const stats = useSyncStats(syncLogs);

  // Calculate errors by entity type
  const errorsByType = useMemo(() => {
    if (!syncErrors) return [];
    
    const counts = syncErrors.reduce((acc, error) => {
      acc[error.entity_type] = (acc[error.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([entity_type, count]) => ({
      entity_type,
      count
    }));
  }, [syncErrors]);

  const handleClearFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setStoreId('all');
    setEntityType('all');
    setStatus('all');
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sync Monitoring</h1>
          <p className="text-muted-foreground">
            Track WooCommerce sync operations, errors, and performance
          </p>
        </div>

        <SyncFilters
          dateRange={dateRange}
          storeId={storeId}
          entityType={entityType}
          status={status}
          stores={stores}
          onDateRangeChange={setDateRange}
          onStoreChange={setStoreId}
          onEntityTypeChange={setEntityType}
          onStatusChange={setStatus}
          onClearFilters={handleClearFilters}
        />

        <SyncStatCards
          totalSyncsToday={stats.totalSyncsToday}
          totalSyncsYesterday={stats.totalSyncsYesterday}
          errorRate={stats.errorRate}
          avgDuration={stats.avgDuration}
          activeStores={stats.activeStores}
        />

        <SyncCharts
          syncsByDay={stats.syncsByDay}
          errorsByType={errorsByType}
        />

        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Recent Syncs</TabsTrigger>
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Recent Syncs</CardTitle>
                <CardDescription>
                  Latest sync operations across all stores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSyncsTable logs={syncLogs || []} isLoading={logsLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>
                  Failed sync operations that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentErrorsTable errors={syncErrors || []} isLoading={errorsLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SyncMonitoring;
