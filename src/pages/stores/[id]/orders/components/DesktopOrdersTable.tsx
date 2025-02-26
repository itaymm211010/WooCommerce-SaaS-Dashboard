
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Order } from "@/types/database";
import { OrderStatus, SortDirection, SortField, orderStatuses } from "../types";
import { StatusBadge } from "./StatusBadge";
import { StatusHistory } from "./StatusHistory";
import { OrderStatusLog } from "../types";

interface DesktopOrdersTableProps {
  orders: Order[];
  storeId: string;
  sortField: SortField;
  onSort: (field: SortField) => void;
  onStatusChange: (orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => void;
  onSelectOrder: (orderId: number) => void;
  statusLogs: OrderStatusLog[];
}

interface SortButtonProps {
  field: SortField;
  children: React.ReactNode;
  onClick: (field: SortField) => void;
}

function SortButton({ field, children, onClick }: SortButtonProps) {
  return (
    <Button 
      variant="ghost" 
      onClick={() => onClick(field)}
      className="flex items-center gap-2"
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  );
}

export function DesktopOrdersTable({
  orders,
  storeId,
  sortField,
  onSort,
  onStatusChange,
  onSelectOrder,
  statusLogs,
}: DesktopOrdersTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableCaption>A list of your store orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="woo_id" onClick={onSort}>Order ID</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="customer_name" onClick={onSort}>Customer</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="total" onClick={onSort}>Total</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status" onClick={onSort}>Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at" onClick={onSort}>Date</SortButton>
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
}
