import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";

interface SyncLogFilters {
  dateRange: { from: Date; to: Date };
  storeId?: string;
  entityType?: string;
  status?: string;
}

export const useSyncLogs = (filters: SyncLogFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sync-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('sync_logs')
        .select('*, stores(name, url)')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      // Apply store filter
      if (filters.storeId && filters.storeId !== 'all') {
        query = query.eq('store_id', filters.storeId);
      }

      // Apply entity type filter
      if (filters.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
};
