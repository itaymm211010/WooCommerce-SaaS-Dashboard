
import { Shell } from "@/components/layout/Shell";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Package, ShoppingCart, ArrowDown, ArrowUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  TooltipProps
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";

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
  
  // Calculate low stock products (less than 5 in stock)
  const lowStock = products?.filter(product => 
    product.stock_quantity !== null && 
    product.stock_quantity > 0 && 
    product.stock_quantity < 5
  ).length || 0;
  
  // Calculate % of products that are out of stock
  const outOfStockPercentage = products?.length ? 
    Math.round((outOfStock / products.length) * 100) : 0;
  
  // Calculate average order value
  const averageOrderValue = orders?.length ? 
    (totalRevenue / orders.length) : 0;
    
  // Get last 7 days of data for the chart
  const last7DaysData = getLastNDaysData(orders, 7);

  // Determine trend (up or down) based on last two days
  const revenueTrend = last7DaysData.length >= 2 ? 
    last7DaysData[last7DaysData.length-1].value > last7DaysData[last7DaysData.length-2].value 
      ? 'up' : 'down' 
    : 'neutral';
  
  // Calculate the percentage change in revenue
  const revenueChangePercentage = getPercentageChange(last7DaysData);

  const stats = [
    {
      name: "Total Revenue",
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${revenueChangePercentage}% ${revenueTrend === 'up' ? 'increase' : 'decrease'} from last day`,
      trend: revenueTrend,
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
      description: `${outOfStock} out of stock (${outOfStockPercentage}%)`,
      secondaryDescription: `${lowStock} low stock`,
      icon: Package
    },
    {
      name: "Avg. Order Value",
      value: `$${averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${orders?.length || 0} total orders`,
      icon: TrendingUp
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
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' && (
                    <ArrowUp className="h-4 w-4 text-emerald-500" />
                  )}
                  {stat.trend === 'down' && (
                    <ArrowDown className="h-4 w-4 text-rose-500" />
                  )}
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.secondaryDescription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.secondaryDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Daily revenue for the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "#8B5CF6",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={last7DaysData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Date
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {payload[0].payload.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Revenue
                                    </span>
                                    <span className="font-bold">
                                      ${typeof payload[0].value === 'number' 
                                        ? payload[0].value.toFixed(2) 
                                        : Number(payload[0].value).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8B5CF6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
};

// Helper function to get the last N days of order data
function getLastNDaysData(orders: any[] | undefined, days: number) {
  if (!orders || orders.length === 0) {
    // Return empty data if no orders
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1) + i);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0
      };
    });
  }

  // Create a map for the last N days
  const daysMap = new Map();
  
  // Initialize the map with the last N days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    daysMap.set(dateStr, { name: dateStr, value: 0 });
  }
  
  // Fill in the actual revenue data
  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Only count if the order is within our days range
    if (daysMap.has(dateStr)) {
      const existing = daysMap.get(dateStr);
      daysMap.set(dateStr, { 
        name: dateStr, 
        value: existing.value + Number(order.total)
      });
    }
  });
  
  // Convert the map to an array and sort by date
  return Array.from(daysMap.values());
}

// Helper function to calculate percentage change
function getPercentageChange(data: { name: string; value: number }[]) {
  if (data.length < 2) return 0;
  
  const currentValue = data[data.length - 1].value;
  const previousValue = data[data.length - 2].value;
  
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export default Index;
