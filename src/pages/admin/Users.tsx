import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { UsersTable } from "./components/UsersTable";

interface UserWithProfile {
  id: string;
  email: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  user_roles: Array<{
    role: string;
  }>;
}

export default function UsersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone
        `);

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        data.map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            id: profile.id,
            email: profile.email || "",
            profiles: {
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone: profile.phone,
            },
            user_roles: roles || [],
          };
        })
      );

      return usersWithRoles as UserWithProfile[];
    },
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Shell>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ניהול משתמשים</CardTitle>
                <CardDescription>
                  נהל משתמשים, תפקידים והרשאות במערכת
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-destructive mb-4">
                שגיאה בטעינת המשתמשים: {error.message}
              </div>
            )}
            <UsersTable
              users={users || []}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
