
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "./EditProfileDialog";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <div className="text-xl font-semibold">לא נמצא פרופיל</div>
          <div>אנא וודא שאתה מחובר למערכת</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
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
              <h3 className="text-sm font-medium text-muted-foreground">אימייל</h3>
              <p className="mt-1 text-lg">{profile.email || 'לא הוגדר'}</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
