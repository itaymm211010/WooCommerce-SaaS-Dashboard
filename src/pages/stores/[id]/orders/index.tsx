
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, ArrowUpDown, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SortField = 'woo_id' | 'customer_name' | 'total' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';
type OrderStatus = 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';

const orderStatuses: OrderStatus[] = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];

export default function StoreOrdersPage() {
  const { id } = useParams();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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

  const sortOrders = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
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

      // עדכון בסיס הנתונים המקומי
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('store_id', id)
        .eq('woo_id', orderId);

      if (error) throw error;

      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const syncOrders = async () => {
    try {
      setIsSyncing(true);
      
      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration. Please check your store URL and API credentials.');
        return;
      }

      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=100&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WooCommerce API Error:', errorText);
        
        if (response.status === 0) {
          throw new Error('CORS error - Please make sure your WooCommerce site allows external connections');
        }
        
        if (response.status === 401) {
          throw new Error('Authentication failed - Please check your API credentials');
        }
        
        if (response.status === 404) {
          throw new Error('Store not found - Please check your store URL');
        }
        
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }

      const wooOrders = await response.json();
      
      if (!Array.isArray(wooOrders)) {
        throw new Error('Invalid response from WooCommerce API');
      }
      
      console.log(`Fetched ${wooOrders.length} orders from WooCommerce`);
      
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
      if (error instanceof Error) {
        toast.error(`Failed to sync orders: ${error.message}`);
      } else {
        toast.error('Failed to sync orders: Unknown error occurred');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {store?.name ? `${store.name} - Orders` : 'Orders'}
            </h1>
            <p className="text-muted-foreground">
              Manage your store orders
            </p>
          </div>
          <Button 
            onClick={syncOrders} 
            className="gap-2"
            disabled={isSyncing}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            {isSyncing ? 'Syncing...' : 'Sync Orders'}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="relative w-[200px]">
            <Input
              placeholder="Order ID"
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
              type="number"
            />
          </div>
        </div>

        <Table>
          <TableCaption>A list of your store orders.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('woo_id')}
                  className="flex items-center gap-2"
                >
                  Order ID
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('customer_name')}
                  className="flex items-center gap-2"
                >
                  Customer
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('total')}
                  className="flex items-center gap-2"
                >
                  Total
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('status')}
                  className="flex items-center gap-2"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('created_at')}
                  className="flex items-center gap-2"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No orders found. Click the Sync button to import orders from WooCommerce.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.woo_id}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>${order.total}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value: OrderStatus) => updateOrderStatus(order.woo_id, value)}
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
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/stores/${id}/orders/${order.woo_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
