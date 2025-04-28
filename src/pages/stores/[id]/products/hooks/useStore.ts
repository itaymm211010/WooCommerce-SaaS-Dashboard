
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Store } from "@/types/database";

export const useStore = (id: string | undefined) => {
  return useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Store;
    },
    enabled: !!id
  });
};
