import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCards from "@/components/dashboard/StatCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock, Bug } from "lucide-react";
import { RecentOrderNotes } from "@/components/dashboard/RecentOrderNotes";
import { StoreSelector } from "@/components/dashboard/StoreSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export const OverviewTab = () => {
  const { user, isAdmin } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data: stores } = useQuery({
    queryKey: ['stores', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from('stores').select('*');
      
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', selectedStoreId, isAdmin, stores],
    queryFn: async () => {
      let query = supabase.from('orders').select('*');
      
      if (selectedStoreId) {
        query = query.eq('store_id', selectedStoreId);
      } else if (!isAdmin && stores && stores.length > 0) {
        const storeIds = stores.map(s => s.id);
        query = query.in('store_id', storeIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && (isAdmin || !!stores)
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bugs } = useQuery({
    queryKey: ["bug_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["project_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_alerts")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter((t) => t.status === "done").length || 0,
    inProgressTasks: tasks?.filter((t) => t.status === "in_progress").length || 0,
    openBugs: bugs?.filter((b) => b.status === "open").length || 0,
    criticalBugs: bugs?.filter((b) => b.severity === "critical" && b.status === "open").length || 0,
  };

  const selectedStore = stores?.find(s => s.id === selectedStoreId);

  return (
    <div className="space-y-6">
      {stores && (isAdmin || stores.length > 1) && (
        <div className="flex justify-end">
          <StoreSelector
            stores={stores}
            selectedStoreId={selectedStoreId}
            onStoreSelect={setSelectedStoreId}
            isAdmin={isAdmin}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openBugs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.criticalBugs} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTasks > 0
                ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.severity === "high" ? "destructive" : "default"}>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <RecentOrderNotes 
        store={selectedStore || stores?.[0]} 
        orders={orders}
      />
    </div>
  );
};
