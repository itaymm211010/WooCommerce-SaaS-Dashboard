
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import { SortDirection, SortField } from "../types";

export function useOrders(
  storeId: string | undefined,
  userHasAccess: boolean,
  sortField: SortField,
  sortDirection: SortDirection,
  searchQuery: string,
  orderIdSearch: string
) {
  return useQuery({
    queryKey: ['orders', storeId, sortField, sortDirection, searchQuery, orderIdSearch],
    queryFn: async () => {
      if (!storeId || !userHasAccess) throw new Error('Unauthorized');
      
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId);

      if (searchQuery) {
        query = query.ilike('customer_name', `%${searchQuery}%`);
      }

      if (orderIdSearch) {
        query = query.eq('woo_id', orderIdSearch);
      }
      
      const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!storeId && userHasAccess
  });
}
