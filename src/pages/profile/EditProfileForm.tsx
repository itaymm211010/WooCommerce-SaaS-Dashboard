
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types/database";

interface EditProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditProfileForm({ profile, onSuccess, onCancel }: EditProfileFormProps) {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success("הפרופיל עודכן בהצלחה");
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">שם פרטי</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="ישראל"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">שם משפחה</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="ישראלי"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="israel@example.com"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">טלפון</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-0000000"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              מעדכן...
            </>
          ) : (
            'שמור שינויים'
          )}
        </Button>
      </div>
    </form>
  );
}
