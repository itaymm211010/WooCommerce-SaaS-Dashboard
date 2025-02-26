
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { OrderStatusLog } from "../types";

export function useStatusLogs(
  storeId: string | undefined,
  selectedOrderId: number | null,
  userHasAccess: boolean
) {
  return useQuery({
    queryKey: ['orderStatusLogs', storeId, selectedOrderId],
    queryFn: async () => {
      if (!storeId || !selectedOrderId || !userHasAccess) return [];
      
      const { data, error } = await supabase
        .from('order_status_logs')
        .select('*')
        .eq('store_id', storeId)
        .eq('order_id', selectedOrderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrderStatusLog[];
    },
    enabled: !!storeId && !!selectedOrderId && userHasAccess
  });
}
