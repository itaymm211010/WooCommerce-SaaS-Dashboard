
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
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function StoreOrdersPage() {
  const { id } = useParams();

  const { data: orders, refetch } = useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', id);
      
      if (error) throw error;
      console.log('Orders data:', data);
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

  const syncOrders = async () => {
    try {
      // טוען את ההזמנות מה-API של WooCommerce
      const response = await fetch(`${store?.url}/wp-json/wc/v3/orders`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${store?.api_key}:${store?.api_secret}`)
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders from WooCommerce');
      }

      const wooOrders = await response.json();
      
      // ממיר את ההזמנות לפורמט של הדאטאבייס שלנו
      const ordersToInsert = wooOrders.map((order: any) => ({
        store_id: id,
        woo_id: order.id,
        status: order.status,
        total: order.total,
        customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
        customer_email: order.billing.email
      }));

      // מוסיף את ההזמנות לדאטאבייס
      const { error } = await supabase
        .from('orders')
        .upsert(ordersToInsert, { onConflict: 'store_id,woo_id' });

      if (error) throw error;

      toast.success('Orders synced successfully');
      refetch(); // מרענן את הטבלה
    } catch (error) {
      console.error('Error syncing orders:', error);
      toast.error('Failed to sync orders');
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
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage your store orders
            </p>
          </div>
          <Button onClick={syncOrders} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Orders
          </Button>
        </div>

        <Table>
          <TableCaption>A list of your store orders.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No orders found. Click the Sync button to import orders from WooCommerce.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.woo_id}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>${order.total}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
