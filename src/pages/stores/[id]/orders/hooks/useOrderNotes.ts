import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

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
      
      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/orders/${orderId}/notes?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order notes from WooCommerce');
      }

      const notes: OrderNote[] = await response.json();
      
      // Sort by date, newest first
      return notes.sort(
        (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      );
    },
    enabled: !!storeId && !!orderId && !!store
  });
};
