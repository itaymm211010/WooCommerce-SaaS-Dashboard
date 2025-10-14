
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AddStoreUserForm } from "./components/AddStoreUserForm";
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<"profiles">;
type StoreUser = Tables<"store_users">;

type StoreUserWithProfile = StoreUser & {
  profiles: Profile;
};

export default function StoreUsersPage() {
  const { id: storeId } = useParams<{ id: string }>();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // בדיקה שיש לנו מזהה חנות תקין
  if (!storeId) {
    return (
      <Shell>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <div className="text-xl font-semibold">לא נמצא מזהה חנות</div>
        </div>
      </Shell>
    );
  }

  const { 
    data: storeUsers, 
    isLoading, 
    refetch,
    isError,
    error 
  } = useQuery({
    queryKey: ['store-users', storeId],
    queryFn: async () => {
      console.log("Fetching store users for store ID:", storeId);
      const { data: storeUsersData, error: storeUsersError } = await supabase
        .from('store_users')
        .select('*')
        .eq('store_id', storeId);

      if (storeUsersError) {
        console.error("Error fetching store users:", storeUsersError);
        throw storeUsersError;
      }

      // Fetch profiles separately
      const userIds = storeUsersData.map(su => su.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Combine the data
      const combined = storeUsersData.map(storeUser => ({
        ...storeUser,
        profiles: profilesData.find(p => p.id === storeUser.user_id)!
      }));
      
      console.log("Store users data:", combined);
      return combined as StoreUserWithProfile[];
    },
    enabled: !!storeId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: store } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // אפקט לרענון הנתונים כאשר הדף נטען
  useEffect(() => {
    if (storeId) {
      refetch();
    }
  }, [storeId, refetch]);

  const handleDeleteUser = async (userId: string) => {
    if (!storeId) return;
    
    setIsDeleting(userId);
    
    try {
      const { error } = await supabase
        .from('store_users')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      toast.success("המשתמש הוסר בהצלחה");
      refetch();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error("אירעה שגיאה בהסרת המשתמש");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleManualRefresh = () => {
    toast.info("מרענן נתונים...");
    refetch();
  };

  const roleLabels: Record<string, string> = {
    'owner': 'בעלים',
    'manager': 'מנהל',
    'viewer': 'צפייה בלבד'
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">משתמשי החנות</h1>
            <p className="text-muted-foreground">
              {store?.name && `ניהול המשתמשים המורשים לחנות "${store.name}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualRefresh} title="רענן נתונים">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus className="ml-2 h-4 w-4" />
              הוסף משתמש
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-8 text-red-500">
            <div>אירעה שגיאה בטעינת המשתמשים</div>
            <div className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'שגיאה לא ידועה'}</div>
            <Button variant="outline" onClick={handleManualRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              נסה שנית
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>רשימת המשתמשים המורשים לחנות זו</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>שם מלא</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>הרשאה</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!storeUsers || storeUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    לא נמצאו משתמשים לחנות זו
                  </TableCell>
                </TableRow>
              ) : (
                storeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.profiles?.first_name} {user.profiles?.last_name}
                    </TableCell>
                    <TableCell>{user.profiles?.email || '-'}</TableCell>
                    <TableCell>{user.profiles?.phone || '-'}</TableCell>
                    <TableCell>{roleLabels[user.role] || user.role}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting === user.user_id}
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        {isDeleting === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {store?.name 
                ? `הוספת משתמש לחנות "${store.name}"`
                : "הוספת משתמש לחנות"}
            </DialogTitle>
            <DialogDescription>
              הוסף משתמשים קיימים או הזמן משתמשים חדשים להצטרף לחנות
            </DialogDescription>
          </DialogHeader>
          <AddStoreUserForm 
            storeId={storeId} 
            storeName={store?.name || ""}
            onSuccess={() => {
              setIsAddUserOpen(false);
              // מרענן את הנתונים לאחר הוספת משתמש
              setTimeout(() => refetch(), 500);
            }}
            onCancel={() => setIsAddUserOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
