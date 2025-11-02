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

export const LogsTab = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["task_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      case "debug":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div>Loading logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Line</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">
                  {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                </TableCell>
                <TableCell>
                  <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">{log.message}</TableCell>
                <TableCell className="text-xs">{log.file_path || "-"}</TableCell>
                <TableCell className="text-xs">{log.line_number || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
