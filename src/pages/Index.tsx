
import { Shell } from "@/components/layout/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCards from "@/components/dashboard/StatCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { StoreSelector } from "@/components/dashboard/StoreSelector";
import { RecentOrderNotes } from "@/components/dashboard/RecentOrderNotes";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { 
  calculateDashboardStats, 
  getLastNDaysData, 
  getPercentageChange 
} from "@/utils/dashboardUtils";

const Index = () => {
  const { user, isAdmin } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Query for stores - admin sees all, regular users see their own
  const { data: stores } = useQuery({
    queryKey: ['stores', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from('stores').select('*');
      
      // If not admin, filter to user's stores only
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Query for products - filtered by selected store
  const { data: products } = useQuery({
    queryKey: ['products', selectedStoreId, isAdmin, stores],
    queryFn: async () => {
      let query = supabase.from('products').select('*');
      
      if (selectedStoreId) {
        // Specific store selected
        query = query.eq('store_id', selectedStoreId);
      } else if (!isAdmin && stores && stores.length > 0) {
        // Regular user - only their stores
        const storeIds = stores.map(s => s.id);
        query = query.in('store_id', storeIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && (isAdmin || !!stores)
  });

  // Query for orders - filtered by selected store
  const { data: orders } = useQuery({
    queryKey: ['orders', selectedStoreId, isAdmin, stores],
    queryFn: async () => {
      let query = supabase.from('orders').select('*');
      
      if (selectedStoreId) {
        // Specific store selected
        query = query.eq('store_id', selectedStoreId);
      } else if (!isAdmin && stores && stores.length > 0) {
        // Regular user - only their stores
        const storeIds = stores.map(s => s.id);
        query = query.in('store_id', storeIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && (isAdmin || !!stores)
  });

  // Get currency for selected store (or first store if no selection)
  const selectedStore = stores?.find(s => s.id === selectedStoreId);
  const currency = selectedStore?.currency || stores?.[0]?.currency || 'ILS';

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
      <div className="space-y-6 sm:space-y-8">
        {/* Header with Store Selector */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Dashboard {isAdmin && "- מנהל ראשי"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedStoreId 
                ? `סטטיסטיקות עבור: ${stores?.find(s => s.id === selectedStoreId)?.name}`
                : isAdmin 
                  ? "סטטיסטיקות כלליות לכל החנויות" 
                  : "סקירה כללית של החנויות שלך"
              }
            </p>
          </div>
          
          {/* Store Selector - only if multiple stores or admin */}
          {stores && (isAdmin || stores.length > 1) && (
            <StoreSelector
              stores={stores}
              selectedStoreId={selectedStoreId}
              onStoreSelect={setSelectedStoreId}
              isAdmin={isAdmin}
            />
          )}
        </div>

        <StatCards 
          stats={stats} 
          revenueChangePercentage={revenueChangePercentage} 
          revenueTrend={revenueTrend}
          currency={currency}
        />

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <RevenueChart data={last7DaysData} />
          <RecentOrderNotes 
            store={selectedStore || stores?.[0]} 
            orders={orders}
          />
        </div>
      </div>
    </Shell>
  );
};

export default Index;
