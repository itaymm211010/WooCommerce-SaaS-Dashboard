
import { Shell } from "@/components/layout/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCards from "@/components/dashboard/StatCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { 
  calculateDashboardStats, 
  getLastNDaysData, 
  getPercentageChange 
} from "@/utils/dashboardUtils";

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

  // Calculate dashboard statistics
  const stats = calculateDashboardStats(orders, products);
  
  // Get last 7 days of data for the chart
  const last7DaysData = getLastNDaysData(orders, 7);

  // Determine trend (up or down) based on last two days
  const revenueTrend = last7DaysData.length >= 2 ? 
    last7DaysData[last7DaysData.length-1].value > last7DaysData[last7DaysData.length-2].value 
      ? 'up' : 'down' 
    : 'neutral';
  
  // Calculate the percentage change in revenue
  const revenueChangePercentage = getPercentageChange(last7DaysData);

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store performance
          </p>
        </div>

        <StatCards 
          stats={stats} 
          revenueChangePercentage={revenueChangePercentage} 
          revenueTrend={revenueTrend} 
        />

        <div className="grid gap-4 grid-cols-1">
          <RevenueChart data={last7DaysData} />
        </div>
      </div>
    </Shell>
  );
};

export default Index;
