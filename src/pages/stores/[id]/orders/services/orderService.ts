
import { supabase } from "@/lib/supabase";
import { Store } from "@/types/database";
import { OrderStatus } from "../types";

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
  let baseUrl = store.url.replace(/\/+$/, '');
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ status: newStatus })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update order status in WooCommerce');
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
