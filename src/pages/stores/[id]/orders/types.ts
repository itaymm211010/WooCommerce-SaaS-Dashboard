
export type SortField = 'woo_id' | 'customer_name' | 'total' | 'status' | 'created_at';
export type SortDirection = 'asc' | 'desc';
export type OrderStatus = 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export const orderStatuses: OrderStatus[] = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];

export interface OrderStatusLog {
  id: string;
  store_id: string;
  order_id: number;
  old_status: OrderStatus;
  new_status: OrderStatus;
  changed_by: string;
  created_at: string;
}

export interface StatusUpdateRequest {
  orderId: number;
  newStatus: OrderStatus;
  oldStatus: OrderStatus;
}
