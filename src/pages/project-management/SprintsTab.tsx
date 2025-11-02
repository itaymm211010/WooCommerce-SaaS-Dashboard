import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { CreateSprintDialog } from "./dialogs/CreateSprintDialog";

export const SprintsTab = () => {
  const { data: sprints, isLoading } = useQuery({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "planned":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div>Loading sprints...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateSprintDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sprints?.map((sprint) => (
        <Card key={sprint.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{sprint.name}</CardTitle>
              <Badge variant={getStatusColor(sprint.status)}>
                {sprint.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {sprint.description && (
              <p className="text-sm text-muted-foreground">
                {sprint.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(sprint.start_date), "MMM d")} -{" "}
                {format(new Date(sprint.end_date), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
};
