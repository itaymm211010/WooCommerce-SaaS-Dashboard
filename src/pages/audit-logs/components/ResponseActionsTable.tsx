import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, UserX, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { useResponseActions } from "../hooks/useResponseActions";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'email_sent':
      return Mail;
    case 'user_suspended':
      return UserX;
    case 'log_created':
      return FileText;
    default:
      return Clock;
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'email_sent':
      return 'Email Sent';
    case 'user_suspended':
      return 'User Suspended';
    case 'log_created':
      return 'Log Created';
    default:
      return actionType;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge variant="default">Medium</Badge>;
    case 'low':
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge>{severity}</Badge>;
  }
};

export function ResponseActionsTable() {
  const { data: actions, isLoading } = useResponseActions(50);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automated Response Actions</CardTitle>
          <CardDescription>
            No automated actions have been taken yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When anomalies are detected, automated responses will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Response Actions</CardTitle>
        <CardDescription>
          Actions taken automatically in response to detected anomalies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => {
                const Icon = getActionIcon(action.action_type);
                return (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getActionLabel(action.action_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.target_email ? (
                        <span className="font-mono text-sm">{action.target_email}</span>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>{getSeverityBadge(action.severity)}</TableCell>
                    <TableCell>{getStatusBadge(action.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(action.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
