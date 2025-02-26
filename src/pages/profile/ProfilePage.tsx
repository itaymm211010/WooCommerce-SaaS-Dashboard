
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EditProfileDialog } from "./EditProfileDialog";
import type { Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div>לא נמצא פרופיל</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">הפרופיל שלי</h1>
          <EditProfileDialog profile={profile} onSuccess={fetchProfile} />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">שם פרטי</h3>
            <p className="mt-1 text-lg">{profile.first_name || 'לא הוגדר'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">שם משפחה</h3>
            <p className="mt-1 text-lg">{profile.last_name || 'לא הוגדר'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">תפקיד</h3>
            <p className="mt-1 text-lg">{profile.role === 'admin' ? 'מנהל' : 'משתמש'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
