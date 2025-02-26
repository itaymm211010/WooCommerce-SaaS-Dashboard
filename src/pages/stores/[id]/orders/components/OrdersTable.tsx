
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order } from "@/types/database";
import { OrderStatus, SortDirection, SortField, orderStatuses } from "../types";
import { StatusHistory } from "./StatusHistory";
import { OrderStatusLog } from "../types";
import { cn } from "@/lib/utils";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-[#F97316] text-white';
    case 'processing':
      return 'bg-[#0EA5E9] text-white';
    case 'completed':
      return 'bg-[#22C55E] text-white';
    case 'on-hold':
      return 'bg-[#EAB308] text-white';
    case 'cancelled':
    case 'failed':
      return 'bg-[#EA384C] text-white';
    case 'refunded':
      return 'bg-[#A855F7] text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn(
    'px-2 py-1 rounded-full text-xs font-medium',
    getStatusColor(status)
  )}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

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

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button 
      variant="ghost" 
      onClick={() => onSort(field)}
      className="flex items-center gap-2"
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  );

  // Mobile view - Cards
  const MobileView = () => (
    <div className="space-y-4 md:hidden">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Order #{order.woo_id}</p>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-lg font-semibold">${order.total}</p>
              </div>
              <div className="space-y-2">
                <Select
                  defaultValue={order.status}
                  onValueChange={(value: OrderStatus) => {
                    onStatusChange(
                      order.woo_id,
                      value,
                      order.status as OrderStatus
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onSelectOrder(order.woo_id)}
                      >
                        View History
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Order #{order.woo_id} Status History</DialogTitle>
                        <DialogDescription>
                          A complete history of status changes for this order.
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <StatusHistory logs={statusLogs} />
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Button variant="secondary" className="flex-1" asChild>
                    <Link to={`/stores/${storeId}/orders/${order.woo_id}/details`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Desktop view - Table
  const DesktopView = () => (
    <div className="hidden md:block">
      <Table>
        <TableCaption>A list of your store orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="woo_id">Order ID</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="customer_name">Customer</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="total">Total</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at">Date</SortButton>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.woo_id}</TableCell>
              <TableCell>{order.customer_name}</TableCell>
              <TableCell>${order.total}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <Select
                    defaultValue={order.status}
                    onValueChange={(value: OrderStatus) => {
                      onStatusChange(
                        order.woo_id,
                        value,
                        order.status as OrderStatus
                      );
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSelectOrder(order.woo_id)}
                    >
                      View History
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Order #{order.woo_id} Status History</DialogTitle>
                      <DialogDescription>
                        A complete history of status changes for this order.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <StatusHistory logs={statusLogs} />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/stores/${storeId}/orders/${order.woo_id}/details`}>
                    View Details
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  );
}
