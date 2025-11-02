import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Store = Tables<"stores">;

interface CreateOrderNoteParams {
  note: string;
  customer_note: boolean;
}

export const useCreateOrderNote = (
  storeId: string,
  orderId: string,
  store?: Store
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note, customer_note }: CreateOrderNoteParams) => {
      if (!store) throw new Error('Store not found');
      
      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/orders/${orderId}/notes?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            note,
            customer_note,
            added_by_user: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create order note');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', storeId, orderId] });
      toast({
        title: "Note added successfully",
        description: "The order note has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
