
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditProfileForm } from "./EditProfileForm";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
import { useState } from "react";

interface EditProfileDialogProps {
  profile: Profile;
  onSuccess?: () => void;
}

export function EditProfileDialog({ profile, onSuccess }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          ערוך פרופיל
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת פרופיל</DialogTitle>
        </DialogHeader>
        <EditProfileForm 
          profile={profile} 
          onSuccess={() => {
            onSuccess?.();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
