
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/types/database";

interface AddStoreUserFormProps {
  storeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddStoreUserForm({ storeId, onSuccess, onCancel }: AddStoreUserFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['profiles', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: existingUsers } = useQuery({
    queryKey: ['store-users-ids', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_users')
        .select('user_id')
        .eq('store_id', storeId);

      if (error) throw error;
      return data.map(item => item.user_id);
    },
    enabled: !!storeId,
  });

  const filteredResults = searchResults?.filter(
    user => !existingUsers?.includes(user.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast.error("יש לבחור משתמש");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('store_users')
        .insert({
          store_id: storeId,
          user_id: selectedUserId,
          role: role as 'owner' | 'manager' | 'viewer',
        });
        
      if (error) throw error;
      
      toast.success("המשתמש נוסף בהצלחה");
      onSuccess?.();
    } catch (error) {
      console.error('Error adding user to store:', error);
      toast.error("אירעה שגיאה בהוספת המשתמש");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: Profile) => {
    setSelectedUserId(user.id);
    // טיפול במצב שבו שדות לא קיימים
    const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const displayEmail = user.email ? ` (${user.email})` : '';
    setSearchQuery(`${displayName}${displayEmail}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="searchUser">חיפוש משתמש</Label>
        <div className="relative">
          <Input
            id="searchUser"
            placeholder="חפש לפי שם או אימייל"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedUserId(null);
            }}
          />
          
          {searchQuery.length >= 2 && !selectedUserId && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
              {isSearching ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredResults?.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">לא נמצאו תוצאות</div>
              ) : (
                <ul className="max-h-60 overflow-auto py-1">
                  {filteredResults?.map((user) => (
                    <li
                      key={user.id}
                      className="cursor-pointer px-4 py-2 hover:bg-muted"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      {user.email && (
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">הרשאה</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="בחר הרשאה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">בעלים</SelectItem>
            <SelectItem value="manager">מנהל</SelectItem>
            <SelectItem value="viewer">צפייה בלבד</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={!selectedUserId || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              מוסיף...
            </>
          ) : (
            'הוסף משתמש'
          )}
        </Button>
      </div>
    </form>
  );
}
