
export interface Webhook {
  id: string;
  store_id: string;
  woo_webhook_id: number | null;
  topic: string;
  delivery_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookType {
  value: string;
  label: string;
  description: string;
}

export const webhookTypes: WebhookType[] = [
  { value: 'order.updated', label: 'Order Status Update', description: 'Get notified when an order status changes' },
  { value: 'order.created', label: 'New Order', description: 'Get notified when a new order is created' },
  { value: 'product.updated', label: 'Product Update', description: 'Get notified when a product is updated' },
  { value: 'product.created', label: 'New Product', description: 'Get notified when a new product is created' },
];
