
import { Order } from "@/types/database";
import { OrderStatus, SortDirection, SortField } from "../types";
import { OrderStatusLog } from "../types";
import { MobileOrderCard } from "./MobileOrderCard";
import { DesktopOrdersTable } from "./DesktopOrdersTable";

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
}

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
}: OrdersTableProps) {
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
            onStatusChange={onStatusChange}
            onSelectOrder={onSelectOrder}
            statusLogs={statusLogs}
          />
        ))}
      </div>
      <DesktopOrdersTable
        orders={orders}
        storeId={storeId}
        sortField={sortField}
        onSort={onSort}
        onStatusChange={onStatusChange}
        onSelectOrder={onSelectOrder}
        statusLogs={statusLogs}
      />
    </>
  );
}
