import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResponseAction {
  id: string;
  anomaly_id: string;
  action_type: 'email_sent' | 'user_suspended' | 'log_created' | 'notification_sent';
  target_user_id: string | null;
  target_email: string | null;
  severity: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useResponseActions(limit = 50) {
  return useQuery({
    queryKey: ['anomaly-response-actions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anomaly_response_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as ResponseAction[];
    },
  });
}
