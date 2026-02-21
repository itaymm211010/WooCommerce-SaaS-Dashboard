
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
import { OrderStatus, SortDirection, SortField } from "../types";
import { OrderStatusLog } from "../types";
import { MobileOrderCard } from "./MobileOrderCard";
import { DesktopOrdersTable } from "./DesktopOrdersTable";
import { toast } from "sonner";
import { useCallback } from "react";

interface OrdersTableProps {
  orders: Order[];
  storeId: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onStatusChange: (orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => void;
  selectedOrderId: number | null;
  onSelectOrder: (orderId: number) => void;
  statusLogs: OrderStatusLog[];
  isLoadingStatusLogs?: boolean;
}

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  'pending': ['processing', 'on-hold', 'cancelled', 'failed'],
  'processing': ['completed', 'on-hold', 'cancelled', 'refunded'],
  'on-hold': ['processing', 'pending', 'cancelled'],
  'completed': ['processing', 'refunded', 'cancelled'],
  'cancelled': ['pending', 'processing', 'on-hold'],
  'refunded': ['processing'],
  'failed': ['pending', 'processing', 'cancelled']
};

const RATE_LIMIT_DELAY = 1000; // 1 second delay between status updates

export function OrdersTable({
  orders,
  storeId,
  sortField,
  sortDirection,
  onSort,
  onStatusChange,
  selectedOrderId,
  onSelectOrder,
  statusLogs,
  isLoadingStatusLogs,
}: OrdersTableProps) {
  const validateStatusChange = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
    const allowedTransitions = allowedStatusTransitions[currentStatus];
    if (!allowedTransitions?.includes(newStatus)) {
      toast.error(`Cannot change status from ${currentStatus} to ${newStatus}`);
      return false;
    }
    return true;
  };

  const lastUpdateTime = useCallback(() => {
    const time = localStorage.getItem('lastStatusUpdate');
    return time ? parseInt(time, 10) : 0;
  }, []);

  const handleStatusChange = useCallback((orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime();
    
    if (timeSinceLastUpdate < RATE_LIMIT_DELAY) {
      toast.error(`Please wait ${Math.ceil((RATE_LIMIT_DELAY - timeSinceLastUpdate) / 1000)} seconds before updating again`);
      return;
    }

    if (validateStatusChange(oldStatus, newStatus)) {
      localStorage.setItem('lastStatusUpdate', now.toString());
      onStatusChange(orderId, newStatus, oldStatus);
    }
  }, [onStatusChange]);

  if (orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No orders found. Click the Sync button to import orders from WooCommerce.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <MobileOrderCard
            key={order.id}
            order={order}
            storeId={storeId}
            onStatusChange={handleStatusChange}
            onSelectOrder={onSelectOrder}
            statusLogs={statusLogs}
            isLoadingStatusLogs={isLoadingStatusLogs}
          />
        ))}
      </div>
      <DesktopOrdersTable
        orders={orders}
        storeId={storeId}
        sortField={sortField}
        onSort={onSort}
        onStatusChange={handleStatusChange}
        onSelectOrder={onSelectOrder}
        statusLogs={statusLogs}
        isLoadingStatusLogs={isLoadingStatusLogs}
      />
    </>
  );
}
