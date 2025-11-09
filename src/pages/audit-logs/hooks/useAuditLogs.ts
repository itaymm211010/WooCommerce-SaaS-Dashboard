import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAuditLogsParams {
  tableName?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs({
  tableName,
  userId,
  startDate,
  endDate,
  action,
  page = 1,
  pageSize = 50,
}: UseAuditLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', { tableName, userId, startDate, endDate, action, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data as AuditLog[],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}
