
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { OrderStatus } from "../types";

type Store = Tables<"stores">;

export async function updateOrderStatus({
  store,
  storeId,
  orderId,
  newStatus,
  oldStatus,
  userEmail
}: {
  store: Store;
  storeId: string;
  orderId: number;
  newStatus: OrderStatus;
  oldStatus: OrderStatus;
  userEmail: string;
}) {
  // Update via secure proxy
  const { data, error } = await supabase.functions.invoke('woo-proxy', {
    body: {
      storeId: store.id,
      endpoint: `/wp-json/wc/v3/orders/${orderId}`,
      method: 'PUT',
      body: { status: newStatus }
    }
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update order status in WooCommerce');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('store_id', storeId)
    .eq('woo_id', orderId);

  if (updateError) throw updateError;

  const { error: logError } = await supabase
    .from('order_status_logs')
    .insert({
      store_id: storeId,
      order_id: orderId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userEmail || 'Unknown'
    });

  if (logError) throw logError;
}
