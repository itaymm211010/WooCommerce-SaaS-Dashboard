
import { Shell } from "@/components/layout/Shell";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Calculate total revenue from orders
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  
  // Calculate number of pending orders
  const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
  
  // Calculate out of stock products
  const outOfStock = products?.filter(product => 
    product.stock_quantity !== null && product.stock_quantity <= 0
  ).length || 0;

  const stats = [
    {
      name: "Total Revenue",
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${pendingOrders} pending orders`,
      icon: TrendingUp
    },
    {
      name: "Orders",
      value: orders?.length.toString() || "0",
      description: `${pendingOrders} pending orders`,
      icon: ShoppingCart
    },
    {
      name: "Products",
      value: products?.length.toString() || "0",
      description: `${outOfStock} out of stock`,
      icon: Package
    },
    {
      name: "Stores",
      value: stores?.length.toString() || "0",
      description: "Connected WooCommerce stores",
      icon: Users
    }
  ];

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
};

export default Index;
