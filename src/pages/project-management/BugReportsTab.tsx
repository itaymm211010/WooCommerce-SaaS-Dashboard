import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CreateBugDialog } from "./dialogs/CreateBugDialog";

export const BugReportsTab = () => {
  const { data: bugs, isLoading } = useQuery({
    queryKey: ["bug_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "blocker":
        return "destructive";
      case "critical":
        return "destructive";
      case "major":
        return "secondary";
      case "moderate":
        return "secondary";
      case "minor":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "default";
      case "in_progress":
        return "secondary";
      case "open":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div>Loading bug reports...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bug Reports</CardTitle>
          <CreateBugDialog />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs?.map((bug) => (
              <TableRow key={bug.id}>
                <TableCell className="font-medium">{bug.title}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(bug.severity)}>
                    {bug.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(bug.status)}>
                    {bug.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {bug.description}
                </TableCell>
                <TableCell>
                  {format(new Date(bug.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {bug.resolved_at
                    ? format(new Date(bug.resolved_at), "MMM d, yyyy")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
