
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";

export type SortField = 'name' | 'price' | 'stock_quantity' | 'status' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export const useProducts = (
  storeId: string | undefined,
  sortField: SortField,
  sortDirection: SortDirection,
  searchQuery: string = ''
) => {
  return useQuery({
    queryKey: ['products', storeId, sortField, sortDirection, searchQuery],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID provided');
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      console.log('Products data:', data);
      return data as Product[];
    },
    enabled: !!storeId
  });
};
