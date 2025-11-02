import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GitCommit, Clock } from "lucide-react";

export const DeploymentsTab = () => {
  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failed":
        return "destructive";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div>Loading deployments...</div>;
  }

  return (
    <div className="space-y-4">
      {deployments?.map((deployment) => (
        <Card key={deployment.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {deployment.environment} - v{deployment.version}
              </CardTitle>
              <Badge variant={getStatusColor(deployment.status)}>
                {deployment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {deployment.git_commit_hash && (
              <div className="flex items-center gap-2 text-sm">
                <GitCommit className="h-4 w-4 text-muted-foreground" />
                <code className="text-xs">{deployment.git_commit_hash}</code>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(deployment.created_at), "MMM d, yyyy HH:mm")}
              </span>
            </div>
            {deployment.notes && (
              <p className="text-sm text-muted-foreground">{deployment.notes}</p>
            )}
            {deployment.error_log && (
              <div className="mt-2 rounded-md bg-destructive/10 p-2">
                <p className="text-xs font-mono text-destructive">
                  {deployment.error_log}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
