
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "../components/StatusBadge";

export default function OrderDetailsPage() {
  const { id: storeId, orderId } = useParams();

  const { data: store } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', storeId, orderId],
    queryFn: async () => {
      if (!storeId || !orderId) throw new Error('Missing required parameters');
      
      let baseUrl = store?.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${store?.api_key}&consumer_secret=${store?.api_secret}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order details from WooCommerce');
      }

      return await response.json();
    },
    enabled: !!storeId && !!orderId && !!store
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Order #{orderId}</h1>
          <StatusBadge status={order?.status || 'unknown'} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {order?.billing?.first_name} {order?.billing?.last_name}</p>
                <p><strong>Email:</strong> {order?.billing?.email}</p>
                <p><strong>Phone:</strong> {order?.billing?.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>{order?.shipping?.first_name} {order?.shipping?.last_name}</p>
                <p>{order?.shipping?.address_1}</p>
                {order?.shipping?.address_2 && <p>{order?.shipping?.address_2}</p>}
                <p>
                  {order?.shipping?.city}, {order?.shipping?.state} {order?.shipping?.postcode}
                </p>
                <p>{order?.shipping?.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order?.line_items?.map((item: any) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">${item.total}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>${order?.subtotal}</p>
                </div>
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p>${order?.shipping_total}</p>
                </div>
                {Number(order?.discount_total) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <p>Discount</p>
                    <p>-${order?.discount_total}</p>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <p>Total</p>
                  <p>${order?.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {order?.customer_note && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Customer Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.customer_note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}
