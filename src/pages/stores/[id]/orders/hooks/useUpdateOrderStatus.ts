import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Store = Tables<"stores">;

interface UpdateOrderStatusParams {
  storeId: string;
  orderId: string;
  status: string;
  store: Store;
}

export const useUpdateOrderStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, orderId, status, store }: UpdateOrderStatusParams) => {
      // Update via secure proxy
      const { data, error } = await supabase.functions.invoke('woo-proxy', {
        body: {
          storeId: store.id,
          endpoint: `/wp-json/wc/v3/orders/${orderId}`,
          method: 'PUT',
          body: { status }
        }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update order status');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['order', variables.storeId, variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.storeId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });
};
