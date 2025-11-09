import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CriticalChange {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export function useCriticalChanges(limit = 20) {
  return useQuery({
    queryKey: ['audit-critical-changes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_critical_changes')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return data as CriticalChange[];
    },
  });
}
