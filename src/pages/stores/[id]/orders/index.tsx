
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { OrdersHeader } from "./components/OrdersHeader";
import { OrdersFilters } from "./components/OrdersFilters";
import { OrdersTable } from "./components/OrdersTable";
import { OrderStatus, SortDirection, SortField, StatusUpdateRequest } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreAccess } from "./hooks/useStoreAccess";
import { useOrders } from "./hooks/useOrders";
import { useStatusLogs } from "./hooks/useStatusLogs";
import { updateOrderStatus } from "./services/orderService";
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
  const { user } = useAuth();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<StatusUpdateRequest | null>(null);

  const { data: userHasAccess } = useStoreAccess(id, user?.id);
  const { data: orders, refetch } = useOrders(id, !!userHasAccess, sortField, sortDirection, searchQuery, orderIdSearch);
  const { data: statusLogs, refetch: refetchLogs } = useStatusLogs(id, selectedOrderId, !!userHasAccess);

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

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus, oldStatus: OrderStatus) => {
    try {
      if (!userHasAccess) {
        toast.error('Unauthorized: You do not have access to this store');
        return;
      }

      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration');
        return;
      }

      await updateOrderStatus({
        store,
        storeId: id!,
        orderId,
        newStatus,
        oldStatus,
        userEmail: user?.email || ''
      });

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

  if (!userHasAccess) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have access to this store.</p>
          </div>
        </div>
      </Shell>
    );
  }

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
                    handleStatusUpdate(
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
