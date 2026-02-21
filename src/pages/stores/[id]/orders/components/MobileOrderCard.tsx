
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
import { OrderStatus, orderStatuses } from "../types";
import { StatusBadge } from "./StatusBadge";
import { StatusHistory } from "./StatusHistory";
import { OrderStatusLog } from "../types";

interface MobileOrderCardProps {
  order: Order;
  storeId: string;
  onStatusChange: (orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => void;
  onSelectOrder: (orderId: number) => void;
  statusLogs: OrderStatusLog[];
  isLoadingStatusLogs?: boolean;
}

export function MobileOrderCard({
  order,
  storeId,
  onStatusChange,
  onSelectOrder,
  statusLogs,
  isLoadingStatusLogs,
}: MobileOrderCardProps) {
  return (
    <Card>
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
              value={order.status ?? undefined}
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
                    {isLoadingStatusLogs ? (
                      <div className="flex items-center justify-center h-full py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <StatusHistory logs={statusLogs} />
                    )}
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
  );
}
