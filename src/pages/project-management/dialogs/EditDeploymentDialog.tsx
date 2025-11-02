import { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EditDeploymentDialogProps {
  deployment: any;
}

export const EditDeploymentDialog = ({
  deployment,
}: EditDeploymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    version: deployment.version,
    environment: deployment.environment,
    git_commit_hash: deployment.git_commit_hash || "",
    status: deployment.status,
    sprint_id: deployment.sprint_id || "",
    notes: deployment.notes || "",
  });

  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprints")
        .select("id, name")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateDeployment = useMutation({
    mutationFn: async (updatedDeployment: typeof formData) => {
      const { data, error } = await supabase
        .from("deployments")
        .update(updatedDeployment)
        .eq("id", deployment.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      toast.success("הפריסה עודכנה בהצלחה");
      setOpen(false);
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון הפריסה: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeployment.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4 ml-2" />
          ערוך
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>עריכת פריסה</DialogTitle>
          <DialogDescription>ערוך את פרטי הפריסה</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">גרסה</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">סביבה</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) =>
                  setFormData({ ...formData, environment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">פיתוח</SelectItem>
                  <SelectItem value="staging">ביניים</SelectItem>
                  <SelectItem value="production">ייצור</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="git_commit_hash">Git Commit Hash</Label>
            <Input
              id="git_commit_hash"
              value={formData.git_commit_hash}
              onChange={(e) =>
                setFormData({ ...formData, git_commit_hash: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="in_progress">בתהליך</SelectItem>
                <SelectItem value="success">הצליח</SelectItem>
                <SelectItem value="failed">נכשל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sprint">ספרינט (אופציונלי)</Label>
            <Select
              value={formData.sprint_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sprint_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר ספרינט" />
              </SelectTrigger>
              <SelectContent>
                {sprints?.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={updateDeployment.isPending}>
              {updateDeployment.isPending ? "שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
