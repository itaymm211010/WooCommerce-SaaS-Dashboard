import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";

export function CreateDeploymentDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    version: "",
    environment: "production",
    status: "pending",
    git_commit_hash: "",
    notes: "",
    sprint_id: "",
  });

  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createDeployment = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("deployments").insert([
        {
          ...data,
          deployed_by: user?.id,
          sprint_id: data.sprint_id || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      toast.success("הפריסה נוצרה בהצלחה");
      setOpen(false);
      setFormData({
        version: "",
        environment: "production",
        status: "pending",
        git_commit_hash: "",
        notes: "",
        sprint_id: "",
      });
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת הפריסה");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDeployment.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          פריסה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>יצירת פריסה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version">גרסה</Label>
              <Input
                id="version"
                required
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="environment">סביבה</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => setFormData({ ...formData, environment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">פיתוח</SelectItem>
                  <SelectItem value="staging">בדיקות</SelectItem>
                  <SelectItem value="production">ייצור</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="git_commit_hash">Git Commit Hash</Label>
            <Input
              id="git_commit_hash"
              placeholder="abc123def456"
              value={formData.git_commit_hash}
              onChange={(e) =>
                setFormData({ ...formData, git_commit_hash: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="status">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
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

          <div>
            <Label htmlFor="sprint">ספרינט</Label>
            <Select
              value={formData.sprint_id}
              onValueChange={(value) => setFormData({ ...formData, sprint_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר ספרינט (אופציונלי)" />
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

          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={createDeployment.isPending}>
              {createDeployment.isPending ? "יוצר..." : "צור פריסה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
