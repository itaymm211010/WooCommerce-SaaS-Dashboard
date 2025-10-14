
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStoreAccess(storeId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['storeAccess', storeId, userId],
    queryFn: async () => {
      if (!storeId || !userId) return false;
      
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error checking store access:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!storeId && !!userId
  });
}
