import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Store = Tables<"stores">;

interface OrderNote {
  id: number;
  author: string;
  date_created: string;
  note: string;
  customer_note: boolean;
}

export const useOrderNotes = (storeId: string, orderId: string, store?: Store) => {
  return useQuery({
    queryKey: ['order-notes', storeId, orderId],
    queryFn: async () => {
      if (!store) throw new Error('Store not found');

      // Fetch via secure proxy
      const { data, error } = await supabase.functions.invoke('woo-proxy', {
        body: {
          storeId: store.id,
          endpoint: `/wp-json/wc/v3/orders/${orderId}/notes`,
          method: 'GET'
        }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to fetch order notes from WooCommerce');
      }

      const notes: OrderNote[] = Array.isArray(data) ? data : [];
      
      // Sort by date, newest first
      return notes.sort(
        (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      );
    },
    enabled: !!storeId && !!orderId && !!store
  });
};
