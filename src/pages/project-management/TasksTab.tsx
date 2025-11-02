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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CreateTaskDialog } from "./dialogs/CreateTaskDialog";
import { EditTaskDialog } from "./dialogs/EditTaskDialog";

export const TasksTab = () => {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          creator:profiles!tasks_created_by_fkey(first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "default";
      case "in_progress":
        return "secondary";
      case "todo":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Tasks</CardTitle>
          <CreateTaskDialog />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>כותרת</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>עדיפות</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>יוצר</TableHead>
              <TableHead>שעות משוערות</TableHead>
              <TableHead>שעות בפועל</TableHead>
              <TableHead>נוצר ב</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {tasks?.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.type}</TableCell>
                  <TableCell>
                    {task.creator 
                      ? `${task.creator.first_name || ''} ${task.creator.last_name || ''}`.trim() || task.creator.email
                      : '-'}
                  </TableCell>
                  <TableCell>{task.estimated_hours || "-"}</TableCell>
                  <TableCell>{task.actual_hours || 0}</TableCell>
                  <TableCell>
                    {format(new Date(task.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <EditTaskDialog task={task} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
