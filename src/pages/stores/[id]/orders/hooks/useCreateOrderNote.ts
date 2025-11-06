import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

      // Create note via secure proxy
      const { data, error } = await supabase.functions.invoke('woo-proxy', {
        body: {
          storeId: store.id,
          endpoint: `/wp-json/wc/v3/orders/${orderId}/notes`,
          method: 'POST',
          body: {
            note,
            customer_note,
            added_by_user: true
          }
        }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create order note');
      }

      return data;
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
