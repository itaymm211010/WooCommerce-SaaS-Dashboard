
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddStoreUserForm } from "./components/AddStoreUserForm";
import type { Profile, StoreUser } from '@/types/database';

type StoreUserWithProfile = StoreUser & {
  profiles: Profile;
};

export default function StoreUsersPage() {
  const { id: storeId } = useParams<{ id: string }>();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: storeUsers, isLoading, refetch } = useQuery({
    queryKey: ['store-users', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_users')
        .select(`
          *,
          profiles(*)
        `)
        .eq('store_id', storeId);

      if (error) throw error;
      return data as StoreUserWithProfile[];
    },
    enabled: !!storeId,
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
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            הוסף משתמש
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              {storeUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    לא נמצאו משתמשים לחנות זו
                  </TableCell>
                </TableRow>
              ) : (
                storeUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.profiles.first_name} {user.profiles.last_name}
                    </TableCell>
                    <TableCell>{user.profiles.email || '-'}</TableCell>
                    <TableCell>{user.profiles.phone || '-'}</TableCell>
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
            <DialogTitle>הוספת משתמש לחנות</DialogTitle>
          </DialogHeader>
          <AddStoreUserForm 
            storeId={storeId!} 
            onSuccess={() => {
              setIsAddUserOpen(false);
              refetch();
            }}
            onCancel={() => setIsAddUserOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
