
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import { toast } from "sonner";
import { useState } from "react";
import { OrdersHeader } from "./components/OrdersHeader";
import { OrdersFilters } from "./components/OrdersFilters";
import { OrdersTable } from "./components/OrdersTable";
import { OrderStatus, SortDirection, SortField, StatusUpdateRequest } from "./types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StoreOrdersPage() {
  const { id } = useParams();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<StatusUpdateRequest | null>(null);

  const { data: orders, refetch } = useQuery({
    queryKey: ['orders', id, sortField, sortDirection, searchQuery, orderIdSearch],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', id);

      if (searchQuery) {
        query = query.ilike('customer_name', `%${searchQuery}%`);
      }

      if (orderIdSearch) {
        query = query.eq('woo_id', orderIdSearch);
      }
      
      const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!id
  });

  const { data: store } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: statusLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['orderStatusLogs', id, selectedOrderId],
    queryFn: async () => {
      if (!id || !selectedOrderId) return [];
      
      const { data, error } = await supabase
        .from('order_status_logs')
        .select('*')
        .eq('store_id', id)
        .eq('order_id', selectedOrderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!selectedOrderId
  });

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => {
    try {
      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration');
        return;
      }

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
        .eq('store_id', id)
        .eq('woo_id', orderId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
          store_id: id,
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: 'Dashboard UI'
        });

      if (logError) throw logError;

      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      refetch();
      if (selectedOrderId === orderId) {
        refetchLogs();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setPendingStatusUpdate(null);
    }
  };

  const syncOrders = async () => {
    try {
      setIsSyncing(true);
      
      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration');
        return;
      }

      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/orders?per_page=100&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders from WooCommerce');
      }

      const wooOrders = await response.json();
      
      const ordersToInsert = wooOrders.map((order: any) => ({
        store_id: id,
        woo_id: order.id,
        status: order.status,
        total: order.total,
        customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
        customer_email: order.billing.email
      }));

      const { error } = await supabase
        .from('orders')
        .upsert(ordersToInsert, { onConflict: 'store_id,woo_id' });

      if (error) throw error;

      toast.success(`Successfully synced ${ordersToInsert.length} orders`);
      refetch();
    } catch (error) {
      console.error('Error syncing orders:', error);
      toast.error('Failed to sync orders');
    } finally {
      setIsSyncing(false);
    }
  };

  const sortOrders = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <OrdersHeader
          storeName={store?.name}
          isSyncing={isSyncing}
          onSyncOrders={syncOrders}
        />

        <OrdersFilters
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          orderIdSearch={orderIdSearch}
          onOrderIdSearchChange={setOrderIdSearch}
        />

        {orders && id && (
          <OrdersTable
            orders={orders}
            storeId={id}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={sortOrders}
            onStatusChange={(orderId, newStatus, oldStatus) => {
              setPendingStatusUpdate({ orderId, newStatus, oldStatus });
            }}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            statusLogs={statusLogs || []}
          />
        )}

        <AlertDialog 
          open={pendingStatusUpdate !== null}
          onOpenChange={() => setPendingStatusUpdate(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change order #{pendingStatusUpdate?.orderId} status from{' '}
                <span className="font-medium">{pendingStatusUpdate?.oldStatus}</span> to{' '}
                <span className="font-medium">{pendingStatusUpdate?.newStatus}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingStatusUpdate) {
                    updateOrderStatus(
                      pendingStatusUpdate.orderId,
                      pendingStatusUpdate.newStatus,
                      pendingStatusUpdate.oldStatus
                    );
                  }
                }}
              >
                Update Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Shell>
  );
}
