import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TimeSeriesData {
  date: string;
  count: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface UserActivityData {
  user_email: string;
  total_changes: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface TableDistributionData {
  table_name: string;
  count: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AuditStats {
  totalChanges: number;
  criticalChanges: number;
  highPriorityChanges: number;
  uniqueUsers: number;
  timeSeriesData: TimeSeriesData[];
  userActivityData: UserActivityData[];
  tableDistribution: TableDistributionData[];
  recentTrends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

const getSeverity = (tableName: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (['stores', 'user_roles'].includes(tableName)) return 'CRITICAL';
  if (['orders', 'store_users', 'webhooks', 'bug_reports'].includes(tableName)) return 'HIGH';
  if (['products', 'deployments', 'profiles'].includes(tableName)) return 'MEDIUM';
  return 'LOW';
};

export function useAuditStats(days = 30) {
  return useQuery({
    queryKey: ['audit-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all logs for the period
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate basic stats
      const totalChanges = logs?.length || 0;
      const criticalChanges = logs?.filter(l => 
        ['stores', 'user_roles'].includes(l.table_name)
      ).length || 0;
      const highPriorityChanges = logs?.filter(l =>
        ['orders', 'store_users', 'webhooks', 'bug_reports'].includes(l.table_name)
      ).length || 0;
      const uniqueUsers = new Set(logs?.map(l => l.user_email).filter(Boolean)).size;

      // Time series data (daily aggregation)
      const timeSeriesMap = new Map<string, { inserts: number; updates: number; deletes: number }>();
      
      logs?.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, { inserts: 0, updates: 0, deletes: 0 });
        }
        const entry = timeSeriesMap.get(date)!;
        if (log.action === 'INSERT') entry.inserts++;
        else if (log.action === 'UPDATE') entry.updates++;
        else if (log.action === 'DELETE') entry.deletes++;
      });

      const timeSeriesData: TimeSeriesData[] = Array.from(timeSeriesMap.entries()).map(([date, counts]) => ({
        date,
        count: counts.inserts + counts.updates + counts.deletes,
        inserts: counts.inserts,
        updates: counts.updates,
        deletes: counts.deletes,
      }));

      // User activity data
      const userActivityMap = new Map<string, { inserts: number; updates: number; deletes: number }>();
      
      logs?.forEach(log => {
        const user = log.user_email || 'System';
        if (!userActivityMap.has(user)) {
          userActivityMap.set(user, { inserts: 0, updates: 0, deletes: 0 });
        }
        const entry = userActivityMap.get(user)!;
        if (log.action === 'INSERT') entry.inserts++;
        else if (log.action === 'UPDATE') entry.updates++;
        else if (log.action === 'DELETE') entry.deletes++;
      });

      const userActivityData: UserActivityData[] = Array.from(userActivityMap.entries())
        .map(([user_email, counts]) => ({
          user_email,
          total_changes: counts.inserts + counts.updates + counts.deletes,
          inserts: counts.inserts,
          updates: counts.updates,
          deletes: counts.deletes,
        }))
        .sort((a, b) => b.total_changes - a.total_changes)
        .slice(0, 10); // Top 10 users

      // Table distribution
      const tableDistributionMap = new Map<string, number>();
      
      logs?.forEach(log => {
        const count = tableDistributionMap.get(log.table_name) || 0;
        tableDistributionMap.set(log.table_name, count + 1);
      });

      const tableDistribution: TableDistributionData[] = Array.from(tableDistributionMap.entries())
        .map(([table_name, count]) => ({
          table_name,
          count,
          severity: getSeverity(table_name),
        }))
        .sort((a, b) => b.count - a.count);

      // Recent trends
      const now = new Date();
      const last7Days = logs?.filter(l => 
        new Date(l.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const last30Days = logs?.filter(l =>
        new Date(l.created_at) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const last90Days = totalChanges;

      const stats: AuditStats = {
        totalChanges,
        criticalChanges,
        highPriorityChanges,
        uniqueUsers,
        timeSeriesData,
        userActivityData,
        tableDistribution,
        recentTrends: {
          last7Days,
          last30Days,
          last90Days,
        },
      };

      return stats;
    },
  });
}
