
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditProfileForm } from "./EditProfileForm";
import type { Profile } from "@/types/database";

interface EditProfileDialogProps {
  profile: Profile;
  onSuccess?: () => void;
}

export function EditProfileDialog({ profile, onSuccess }: EditProfileDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          ערוך פרופיל
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת פרופיל</DialogTitle>
        </DialogHeader>
        <EditProfileForm profile={profile} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}

