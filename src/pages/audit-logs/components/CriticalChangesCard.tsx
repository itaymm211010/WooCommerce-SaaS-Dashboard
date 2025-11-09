import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCriticalChanges } from "../hooks/useCriticalChanges";

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <Shield className="h-4 w-4 text-blue-500" />;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'default';
    default:
      return 'secondary';
  }
}

export function CriticalChangesCard() {
  const { data: changes, isLoading } = useCriticalChanges(10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No critical changes detected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Critical Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {changes.map((change) => (
            <div
              key={change.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="mt-0.5">
                {getSeverityIcon(change.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getSeverityColor(change.severity)} className="text-xs">
                    {change.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {change.table_name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {change.action}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {change.user_email || 'System'}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {format(new Date(change.created_at), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
