
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
import { Loader2, Plus, Search, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/types/database";

interface AddStoreUserFormProps {
  storeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddStoreUserForm({ storeId, onSuccess, onCancel }: AddStoreUserFormProps) {
  // משתני מצב לחיפוש משתמש קיים
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // משתני מצב להוספת משתמש חדש
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // משתני מצב משותפים
  const [role, setRole] = useState<string>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("search");

  // שאילתה לחיפוש משתמשים
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['profiles', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: searchQuery.length >= 2,
  });

  // שאילתה לקבלת משתמשים קיימים בחנות
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

  // סינון תוצאות החיפוש כדי להציג רק משתמשים שעדיין לא קיימים בחנות
  const filteredResults = searchResults?.filter(
    user => !existingUsers?.includes(user.id)
  );

  // טיפול בבחירת משתמש קיים
  const handleUserSelect = (user: Profile) => {
    setSelectedUserId(user.id);
    const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    setSearchQuery(displayName || user.id);
  };

  // הוספת משתמש קיים לחנות
  const handleAddExistingUser = async (e: React.FormEvent) => {
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
    } catch (error: any) {
      console.error('Error adding user to store:', error);
      toast.error(`אירעה שגיאה בהוספת המשתמש: ${error.message || 'שגיאה לא ידועה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // יצירת הזמנה למשתמש חדש
  const handleInviteNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // קביעת כתובת ה-redirect הנכונה - לא לוקלהוסט!
      const currentUrl = window.location.origin;
      console.log("Current URL for redirect:", currentUrl);
      
      // בדיקה אם המשתמש כבר קיים במערכת
      const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // חשוב מאוד - להגדיר את כתובת ההפניה לאחר לחיצה על הקישור באימייל
          emailRedirectTo: currentUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            invite_to_store: storeId,
            invite_role: role
          }
        }
      });
      
      if (authError) throw authError;
      
      toast.success("נשלחה הזמנה למשתמש בהצלחה");
      toast.info("המשתמש יקבל אימייל עם קישור להתחברות וכניסה למערכת");
      onSuccess?.();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(`אירעה שגיאה בשליחת ההזמנה: ${error.message || 'שגיאה לא ידועה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="search">
          <Search className="h-4 w-4 mr-2" />
          חיפוש משתמש קיים
        </TabsTrigger>
        <TabsTrigger value="create">
          <Plus className="h-4 w-4 mr-2" />
          הזמנת משתמש חדש
        </TabsTrigger>
      </TabsList>
      
      {/* טאב לחיפוש משתמש קיים */}
      <TabsContent value="search">
        <form onSubmit={handleAddExistingUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchUser">חפש משתמש קיים</Label>
            <div className="relative">
              <Input
                id="searchUser"
                placeholder="חפש לפי שם"
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
      </TabsContent>
      
      {/* טאב להזמנת משתמש חדש */}
      <TabsContent value="create">
        <form onSubmit={handleInviteNewUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              אימייל
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newUserRole">הרשאה</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="newUserRole">
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
            <Button type="submit" disabled={!email || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  שולח הזמנה...
                </>
              ) : (
                'שלח הזמנה'
              )}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
